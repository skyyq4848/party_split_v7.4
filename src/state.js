/**
 * 應用狀態管理
 */
import { StorageManager } from './storage.js';

export class AppState {
  constructor() {
    this.storage = new StorageManager();
    this.listeners = new Set();

    // 初始化狀態
    this.state = this.storage.loadState();

    // UI 暫存狀態（不持久化）
    this.uiState = {
      editSelectedIndex: null,
      editGroupIndex: null,
      groupSelectedPeople: [],
      manualRows: []
    };
  }

  /**
   * 取得當前狀態
   */
  getState() {
    return { ...this.state };
  }

  /**
   * 更新狀態
   */
  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.storage.saveState(this.state);
    this.notifyListeners();
  }

  /**
   * 批次更新（只觸發一次監聽器）
   */
  batchUpdate(updateFn) {
    updateFn(this.state);
    this.storage.saveState(this.state);
    this.notifyListeners();
  }

  /**
   * 訂閱狀態變更
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知所有監聽器
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('[State] Listener error:', error);
      }
    });
  }

  /**
   * 重置所有資料
   */
  reset() {
    this.state = {
      people: [],
      party: [],
      personal: [],
      advance: [],
      groups: [],
      primaryPayer: '',
      consolidateAdvance: false,
      parseMode: 'auto'
    };
    this.uiState = {
      editSelectedIndex: null,
      editGroupIndex: null,
      groupSelectedPeople: [],
      manualRows: []
    };
    this.storage.saveState(this.state);
    this.notifyListeners();
  }

  // ===== 便捷方法 =====

  /**
   * 取得人員清單
   */
  getPeople() {
    return [...this.state.people];
  }

  /**
   * 新增人員
   */
  addPerson(name) {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    if (!trimmed || this.state.people.includes(trimmed)) return false;

    this.setState({
      people: [...this.state.people, trimmed]
    });
    return true;
  }

  /**
   * 批次新增人員
   */
  addPeople(names) {
    if (!Array.isArray(names)) return 0;

    let count = 0;
    const newPeople = [...this.state.people];

    names.forEach(name => {
      const trimmed = name.trim();
      if (trimmed && !newPeople.includes(trimmed)) {
        newPeople.push(trimmed);
        count++;
      }
    });

    if (count > 0) {
      this.setState({ people: newPeople });
    }
    return count;
  }

  /**
   * 刪除人員（並清理相關資料）
   */
  deletePerson(index) {
    if (index < 0 || index >= this.state.people.length) return false;

    const name = this.state.people[index];

    this.batchUpdate(state => {
      // 從 people 移除
      state.people = state.people.filter((_, i) => i !== index);

      // 清理 party 中的 members
      state.party = state.party.map(item => ({
        ...item,
        members: item.members ? item.members.filter(p => p !== name) : []
      }));

      // 清理 personal
      state.personal = state.personal.filter(item => item.person !== name);

      // 清理 advance
      state.advance = state.advance.filter(item => item.person !== name);

      // 若刪除的是主要付錢人，清空設定
      if (state.primaryPayer === name) {
        state.primaryPayer = '';
      }
    });

    return true;
  }

  /**
   * 新增群組
   */
  addGroup(name, members) {
    if (!name || !Array.isArray(members) || members.length === 0) return false;

    this.setState({
      groups: [...this.state.groups, { name: name.trim(), members: [...members] }]
    });
    return true;
  }

  /**
   * 刪除群組
   */
  deleteGroup(index) {
    if (index < 0 || index >= this.state.groups.length) return false;

    this.setState({
      groups: this.state.groups.filter((_, i) => i !== index)
    });
    return true;
  }

  /**
   * 更新群組
   */
  updateGroup(index, updates) {
    if (index < 0 || index >= this.state.groups.length) return false;

    this.setState({
      groups: this.state.groups.map((group, i) =>
        i === index ? { ...group, ...updates } : group
      )
    });
    return true;
  }

  /**
   * 新增派對費用
   */
  addPartyItem(item) {
    this.setState({
      party: [...this.state.party, item]
    });
  }

  /**
   * 刪除派對費用
   */
  deletePartyItem(index) {
    if (index < 0 || index >= this.state.party.length) return false;

    this.setState({
      party: this.state.party.filter((_, i) => i !== index)
    });
    return true;
  }

  /**
   * 更新派對費用
   */
  updatePartyItem(index, updates) {
    if (index < 0 || index >= this.state.party.length) return false;

    this.setState({
      party: this.state.party.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      )
    });
    return true;
  }

  /**
   * 新增個人費用
   */
  addPersonalItem(item) {
    this.setState({
      personal: [...this.state.personal, item]
    });
  }

  /**
   * 刪除個人費用
   */
  deletePersonalItem(index) {
    if (index < 0 || index >= this.state.personal.length) return false;

    this.setState({
      personal: this.state.personal.filter((_, i) => i !== index)
    });
    return true;
  }

  /**
   * 更新個人費用
   */
  updatePersonalItem(index, updates) {
    if (index < 0 || index >= this.state.personal.length) return false;

    this.setState({
      personal: this.state.personal.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      )
    });
    return true;
  }

  /**
   * 新增代付項目
   */
  addAdvanceItem(item) {
    this.setState({
      advance: [...this.state.advance, item]
    });
  }

  /**
   * 刪除代付項目
   */
  deleteAdvanceItem(index) {
    if (index < 0 || index >= this.state.advance.length) return false;

    this.setState({
      advance: this.state.advance.filter((_, i) => i !== index)
    });
    return true;
  }

  /**
   * 更新代付項目
   */
  updateAdvanceItem(index, updates) {
    if (index < 0 || index >= this.state.advance.length) return false;

    this.setState({
      advance: this.state.advance.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      )
    });
    return true;
  }

  /**
   * 設定主要付錢人
   */
  setPrimaryPayer(payer) {
    this.setState({ primaryPayer: payer || '' });
  }

  /**
   * 設定合併代付
   */
  setConsolidateAdvance(value) {
    this.setState({ consolidateAdvance: !!value });
  }

  /**
   * 設定解析模式
   */
  setParseMode(mode) {
    if (mode !== 'auto' && mode !== 'manual') return false;
    this.setState({ parseMode: mode });
    return true;
  }

  /**
   * 批次替換所有費用資料
   */
  replaceAllItems(party, personal, advance) {
    this.batchUpdate(state => {
      state.party = party || [];
      state.personal = personal || [];
      state.advance = advance || [];
    });
  }
}
