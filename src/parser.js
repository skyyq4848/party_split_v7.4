/**
 * 帳單解析器
 */
import { parsePrice } from './utils.js';

export class BillParser {
  constructor(state) {
    this.state = state;
  }

  /**
   * 解析文字帳單
   */
  parse(text) {
    if (!text || typeof text !== 'string') return;

    const lines = text.split('\n');
    const people = this.state.getPeople();
    const primaryPayer = this.state.state.primaryPayer;

    const party = [];
    const personal = [];
    const advance = [];

    let currentCategory = '未分類';

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i].trim();

      // 跳過空行
      if (raw === '') continue;

      // 解析區塊標題
      if (this.isCategoryLine(raw)) {
        currentCategory = this.parseCategory(raw);
        continue;
      }

      // 跳過小計/總計行
      if (raw.includes('小計') || raw.includes('總計')) {
        continue;
      }

      // 解析價格
      const price = parsePrice(raw);

      // 解析代付項目（含"出"關鍵字）
      if (raw.includes('出')) {
        const advanceItem = this.parseAdvance(raw, price, people);
        if (advanceItem) {
          advance.push(advanceItem);
          continue;
        }
      }

      // 解析個人費用（首字為已知人名）
      const tokens = raw.split(/\s+/);
      if (tokens.length > 0 && people.includes(tokens[0])) {
        const personalItem = this.parsePersonal(raw, tokens[0], price, primaryPayer);
        personal.push(personalItem);
        continue;
      }

      // 其餘視為派對費用
      const partyItem = this.parseParty(raw, price, currentCategory, people, primaryPayer);
      party.push(partyItem);
    }

    // 批次更新狀態
    this.state.batchUpdate(state => {
      state.party = [...state.party, ...party];
      state.personal = [...state.personal, ...personal];
      state.advance = [...state.advance, ...advance];
    });

    return { party, personal, advance };
  }

  /**
   * 判斷是否為分類標題行
   */
  isCategoryLine(line) {
    return /費用/.test(line) && /-{3,}/.test(line);
  }

  /**
   * 解析分類標題
   */
  parseCategory(line) {
    return line.replace(/[-]+/g, '').trim();
  }

  /**
   * 解析代付項目
   */
  parseAdvance(raw, price, people) {
    const parts = raw.split('出');
    if (parts.length < 2) return null;

    const person = parts[0].trim();
    const itemDesc = parts[1].trim();

    // 清理品項描述（移除價格部分）
    const cleanItem = this.cleanItemDescription(itemDesc);

    return {
      person: person,
      item: cleanItem,
      price: Number(price) || 0,
      members: people.slice(),
      custom: false
    };
  }

  /**
   * 解析個人費用
   */
  parsePersonal(raw, person, price, primaryPayer) {
    // 移除人名
    let itemPart = raw.replace(new RegExp('^' + person), '').trim();

    // 移除價格部分
    itemPart = this.cleanItemDescription(itemPart);

    return {
      person: person,
      item: itemPart,
      price: Number(price) || 0,
      payer: primaryPayer || person
    };
  }

  /**
   * 解析派對費用
   */
  parseParty(raw, price, category, people, primaryPayer) {
    return {
      cat: category,
      item: raw,
      price: Number(price) || 0,
      payer: primaryPayer || '',
      members: people.slice()
    };
  }

  /**
   * 清理品項描述（移除價格標記）
   */
  cleanItemDescription(text) {
    return text
      .replace(/(\d+(?:\.\d+)?)(\s*元|(\s*NT\$?)|(\s*\$))?(\s*)$/, '')
      .trim();
  }

  /**
   * 載入示範範例
   */
  static getExample() {
    return `--------------- 雞蛋糕費用 ---------------
牛奶糖 $33
乳酪 $121
雞蛋 $99
牛奶 $40
奶油 $30

--------------- 飲料費用 ---------------
藍天 胭脂歐蕾 $78 溫無糖
藍天 熟成榛果歐蕾 $80 微冰無糖
藍天 胭脂紅茶 $55 微冰無糖
藍天 熟成榛果歐蕾 $80 少冰無糖
麻煩 熟成歐蕾 $75 常溫無糖
沒角 熟成歐蕾 $150 去冰半糖
yuna 金蜜歐蕾 $70 中杯 去冰無糖
手手 春芽冷露 $65 去冰無糖
闆娘 春檸綠茶 $65 去冰無糖
阿文 胭脂歐蕾 $78 微冰微糖

--------------- 點心費用 ---------------
藍天 出 大布丁 167元
闆娘 出 海鮮大拼盤 500元
沒角 出 生乳捲 210元`;
  }
}
