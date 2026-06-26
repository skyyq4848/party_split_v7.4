/**
 * 結算計算引擎
 */
import { floor2, fmtMoney } from './utils.js';

export class Calculator {
  constructor(state) {
    this.state = state;
  }

  /**
   * 計算結算
   */
  calculate() {
    const { people, party, personal, advance, primaryPayer, consolidateAdvance } = this.state.getState();

    // 驗證
    if (!people || people.length === 0) {
      throw new Error('請先新增參加人員再進行計算');
    }

    // 初始化餘額
    const balance = this.initializeBalance(people);

    // 計算統計資料
    const stats = this.calculateStats(people, party, personal, advance);

    // 扣除派對分攤
    this.deductPartyShares(balance, party, people, stats.partyShareMap);

    // 扣除個人費用
    this.deductPersonalExpenses(balance, personal, stats.personalTotals);

    // 扣除代付分攤
    this.deductAdvanceShares(balance, advance, people);

    // 加入付款人收款
    this.addPayerCredits(balance, party, personal, advance, primaryPayer, consolidateAdvance);

    // 建立債權債務列表
    let { creditors, debtors } = this.createCreditorsDebtors(balance);

    // 定向配對
    const directedMap = this.directedMatching(
      creditors,
      debtors,
      party,
      personal,
      advance,
      primaryPayer,
      consolidateAdvance
    );

    // 移除已配對完成的債權債務
    creditors = creditors.filter(c => c.amt > 0);
    debtors = debtors.filter(d => d.amt > 0);

    // 貪婪配對
    const pairLines = this.greedyMatching(creditors, debtors);

    // 產生結果
    return {
      balance,
      stats,
      directedMap,
      pairLines,
      remainingCreditors: creditors.filter(c => c.amt > 0),
      remainingDebtors: debtors.filter(d => d.amt > 0)
    };
  }

  /**
   * 初始化餘額
   */
  initializeBalance(people) {
    const balance = {};
    people.forEach(person => {
      balance[person] = 0;
    });
    return balance;
  }

  /**
   * 計算統計資料
   */
  calculateStats(people, party, personal, advance) {
    const partyShareMap = {};
    const personalTotals = {};
    const advancePaidMap = {};
    const advanceShareOwed = {};

    people.forEach(person => {
      partyShareMap[person] = 0;
      personalTotals[person] = 0;
      advancePaidMap[person] = 0;
      advanceShareOwed[person] = 0;
    });

    return {
      partyShareMap,
      personalTotals,
      advancePaidMap,
      advanceShareOwed
    };
  }

  /**
   * 扣除派對分攤費用
   */
  deductPartyShares(balance, party, people, partyShareMap) {
    party.forEach(item => {
      const members = item.members && item.members.length ? item.members : people.slice();
      const per = floor2(item.price / members.length);

      members.forEach(member => {
        balance[member] -= per;
        partyShareMap[member] += per;
      });
    });
  }

  /**
   * 扣除個人費用
   */
  deductPersonalExpenses(balance, personal, personalTotals) {
    personal.forEach(item => {
      const price = floor2(item.price);
      balance[item.person] -= price;
      personalTotals[item.person] += price;
    });
  }

  /**
   * 扣除代付分攤
   */
  deductAdvanceShares(balance, advance, people) {
    advance.forEach(item => {
      const members = item.members && item.members.length ? item.members : people.slice();
      const per = floor2(item.price / members.length);

      members.forEach(member => {
        if (typeof balance[member] !== 'undefined') {
          balance[member] -= per;
        }
      });
    });
  }

  /**
   * 加入付款人收款
   */
  addPayerCredits(balance, party, personal, advance, primaryPayer, consolidateAdvance) {
    // 派對費用付款人
    party.forEach(item => {
      if (!item.payer || item.payer === '') return;

      const price = floor2(item.price);

      if (consolidateAdvance && primaryPayer && item.payer !== primaryPayer) {
        balance[item.payer] -= price;
        balance[primaryPayer] += price;
      } else {
        balance[item.payer] += price;
      }
    });

    // 個人費用付款人
    personal.forEach(item => {
      if (!item.payer || item.payer === '') return;

      const price = floor2(item.price);

      if (consolidateAdvance && primaryPayer && item.payer !== primaryPayer) {
        balance[item.payer] -= price;
        balance[primaryPayer] += price;
      } else {
        balance[item.payer] += price;
      }
    });

    // 代付
    advance.forEach(item => {
      const price = floor2(item.price);

      if (consolidateAdvance && primaryPayer && item.person !== primaryPayer) {
        balance[item.person] -= price;
        balance[primaryPayer] += price;
      } else {
        balance[item.person] += price;
      }
    });
  }

  /**
   * 建立債權債務列表
   */
  createCreditorsDebtors(balance) {
    const creditors = [];
    const debtors = [];

    Object.keys(balance).forEach(person => {
      if (balance[person] > 0) {
        creditors.push({ p: person, amt: balance[person] });
      }
      if (balance[person] < 0) {
        debtors.push({ p: person, amt: -balance[person] });
      }
    });

    // 排序：大額優先
    creditors.sort((a, b) => b.amt - a.amt);
    debtors.sort((a, b) => b.amt - a.amt);

    return { creditors, debtors };
  }

  /**
   * 定向配對
   */
  directedMatching(creditors, debtors, party, personal, advance, primaryPayer, consolidateAdvance) {
    const directedMap = {};

    const addDirectedItem = (debtor, payer, desc, amt, type = 'personal') => {
      if (!directedMap[debtor]) directedMap[debtor] = {};
      if (!directedMap[debtor][payer]) directedMap[debtor][payer] = { items: [], total: 0 };
      directedMap[debtor][payer].items.push({ desc, amt: Number(amt) || 0, type });
      directedMap[debtor][payer].total += Number(amt) || 0;
    };

    // 個人費用配對
    this.matchPersonal(personal, debtors, creditors, addDirectedItem);

    // 派對費用配對
    this.matchParty(party, debtors, creditors, addDirectedItem);

    // 代付配對
    this.matchAdvance(advance, debtors, creditors, addDirectedItem, primaryPayer, consolidateAdvance, directedMap);

    return directedMap;
  }

  /**
   * 個人費用配對
   */
  matchPersonal(personal, debtors, creditors, addDirectedItem) {
    personal.forEach(item => {
      if (!item.payer || item.payer === '' || item.person === item.payer) return;

      addDirectedItem(item.person, item.payer, item.item || '(項目)', item.price, 'personal');

      const debtorObj = debtors.find(d => d.p === item.person);
      const creditorObj = creditors.find(c => c.p === item.payer);

      if (!debtorObj || debtorObj.amt <= 0) return;
      if (!creditorObj) return;

      const pay = Math.min(debtorObj.amt, item.price, creditorObj.amt);
      if (pay > 0) {
        debtorObj.amt -= pay;
        creditorObj.amt -= pay;
      }
    });
  }

  /**
   * 派對費用配對
   */
  matchParty(party, debtors, creditors, addDirectedItem) {
    party.forEach(item => {
      if (!item.payer || item.payer === '') return;

      const members = item.members && item.members.length ? item.members : [];
      const per = floor2(item.price / members.length);

      members.forEach(member => {
        if (member === item.payer) return;

        addDirectedItem(member, item.payer, item.item || '(派對項目)', per, 'party');

        const debtorObj = debtors.find(d => d.p === member);
        const creditorObj = creditors.find(c => c.p === item.payer);

        if (!debtorObj || debtorObj.amt <= 0) return;
        if (!creditorObj) return;

        const pay = Math.min(debtorObj.amt, per, creditorObj.amt);
        if (pay > 0) {
          debtorObj.amt -= pay;
          creditorObj.amt -= pay;
        }
      });
    });
  }

  /**
   * 代付配對
   */
  matchAdvance(advance, debtors, creditors, addDirectedItem, primaryPayer, consolidateAdvance, directedMap) {
    advance.forEach(item => {
      if (!item || (Number(item.price) || 0) === 0) return;

      const members = item.members && item.members.length ? item.members : [];
      const per = floor2(item.price / members.length);

      if (consolidateAdvance && primaryPayer) {
        // 合併模式
        this.matchAdvanceConsolidated(item, members, per, primaryPayer, debtors, creditors, addDirectedItem, directedMap);
      } else {
        // 原始模式
        this.matchAdvanceNormal(item, members, per, debtors, creditors, addDirectedItem);
      }
    });
  }

  /**
   * 代付配對 - 合併模式
   */
  matchAdvanceConsolidated(item, members, per, primaryPayer, debtors, creditors, addDirectedItem, directedMap) {
    members.forEach(member => {
      if (member === primaryPayer) return;

      addDirectedItem(member, primaryPayer, item.item || '(代出費用)', per, 'advance');

      const debtorObj = debtors.find(d => d.p === member);
      const creditorObj = creditors.find(c => c.p === primaryPayer);

      if (debtorObj && debtorObj.amt > 0 && creditorObj) {
        const pay = Math.min(debtorObj.amt, per, creditorObj.amt);
        if (pay > 0) {
          debtorObj.amt -= pay;
          creditorObj.amt -= pay;
        }
      }
    });

    // 處理代付者補償
    if (item.person && item.person !== primaryPayer) {
      const paidAmt = Number(item.price) || 0;
      const debtor = item.person;
      const payer = primaryPayer;

      if (directedMap[debtor] && directedMap[debtor][payer]) {
        directedMap[debtor][payer].total -= paidAmt;
        directedMap[debtor][payer].items.push({ desc: '(代出抵扣)', amt: -paidAmt, type: 'advance' });

        if (directedMap[debtor][payer].total <= 0) {
          const surplus = -directedMap[debtor][payer].total;
          delete directedMap[debtor][payer];

          if (!directedMap[payer]) directedMap[payer] = {};
          if (!directedMap[payer][debtor]) directedMap[payer][debtor] = { items: [], total: 0 };
          directedMap[payer][debtor].items.push({ desc: item.item + ' (代出補償)', amt: surplus, type: 'advance' });
          directedMap[payer][debtor].total += surplus;
        }
      }
    }
  }

  /**
   * 代付配對 - 原始模式
   */
  matchAdvanceNormal(item, members, per, debtors, creditors, addDirectedItem) {
    members.forEach(member => {
      if (member === item.person) return;

      addDirectedItem(member, item.person, item.item || '(代出費用)', per, 'advance');

      const debtorObj = debtors.find(d => d.p === member);
      const creditorObj = creditors.find(c => c.p === item.person);

      if (!debtorObj || debtorObj.amt <= 0) return;
      if (!creditorObj) return;

      const pay = Math.min(debtorObj.amt, per, creditorObj.amt);
      if (pay > 0) {
        debtorObj.amt -= pay;
        creditorObj.amt -= pay;
      }
    });
  }

  /**
   * 貪婪配對
   */
  greedyMatching(creditors, debtors) {
    const pairLines = [];

    debtors.forEach(debtor => {
      creditors.forEach(creditor => {
        if (debtor.amt > 0 && creditor.amt > 0) {
          const pay = Math.min(debtor.amt, creditor.amt);
          pairLines.push(`${debtor.p} → ${creditor.p} ${fmtMoney(pay)}`);
          debtor.amt -= pay;
          creditor.amt -= pay;
        }
      });
    });

    return pairLines;
  }
}
