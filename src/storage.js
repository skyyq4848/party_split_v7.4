/**
 * LocalStorage 管理模組
 */
export class StorageManager {
  constructor() {
    this.keys = {
      PEOPLE: 'people',
      PARTY: 'party',
      PERSONAL: 'personal',
      ADVANCE: 'advance',
      GROUPS: 'groups',
      PRIMARY_PAYER: 'primaryPayer',
      CONSOLIDATE_ADVANCE: 'consolidateAdvance',
      PARSE_MODE: 'parseMode'
    };
  }

  /**
   * 讀取資料
   */
  load(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;
      return JSON.parse(value);
    } catch (error) {
      console.error(`[Storage] Failed to load ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * 儲存資料
   */
  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[Storage] Failed to save ${key}:`, error);
      return false;
    }
  }

  /**
   * 讀取字串
   */
  loadString(key, defaultValue = '') {
    return localStorage.getItem(key) || defaultValue;
  }

  /**
   * 儲存字串
   */
  saveString(key, value) {
    localStorage.setItem(key, value);
  }

  /**
   * 清空所有資料
   */
  clear() {
    Object.values(this.keys).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * 載入完整狀態
   */
  loadState() {
    return {
      people: this.load(this.keys.PEOPLE, []),
      party: this.load(this.keys.PARTY, []),
      personal: this.load(this.keys.PERSONAL, []),
      advance: this.load(this.keys.ADVANCE, []),
      groups: this.load(this.keys.GROUPS, []),
      primaryPayer: this.loadString(this.keys.PRIMARY_PAYER, ''),
      consolidateAdvance: this.load(this.keys.CONSOLIDATE_ADVANCE, false),
      parseMode: this.loadString(this.keys.PARSE_MODE, 'auto')
    };
  }

  /**
   * 儲存完整狀態
   */
  saveState(state) {
    this.save(this.keys.PEOPLE, state.people);
    this.save(this.keys.PARTY, state.party);
    this.save(this.keys.PERSONAL, state.personal);
    this.save(this.keys.ADVANCE, state.advance);
    this.save(this.keys.GROUPS, state.groups);
    this.saveString(this.keys.PRIMARY_PAYER, state.primaryPayer);
    this.save(this.keys.CONSOLIDATE_ADVANCE, state.consolidateAdvance);
    this.saveString(this.keys.PARSE_MODE, state.parseMode);
  }
}
