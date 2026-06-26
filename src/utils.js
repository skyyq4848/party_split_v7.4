/**
 * 工具函數模組
 */

/**
 * 金額計算：取到小數點第 2 位
 */
export function floor2(x) {
  return Math.floor((Number(x) || 0) * 100) / 100;
}

/**
 * 金額格式化
 */
export function fmtMoney(x) {
  return floor2(x).toFixed(2);
}

/**
 * HTML 跳脫，防止 XSS
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * 正規化人名輸入（支援多種分隔符）
 */
export function normalizeNames(input) {
  if (!input || typeof input !== 'string') return [];

  // 將所有常見分隔符統一轉成英文逗號
  // 　 = 全形空格
  const normalized = input.replace(/[\s　,，;；\t]+/g, ',');

  return normalized
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * 解析價格（支援表達式如 "85 * 3"）
 */
export function parsePrice(str) {
  if (!str || typeof str !== 'string') return 0;

  // 支援乘法表達式
  const multi = str.match(/(\d+(?:\.\d+)?)\s*\*\s*(\d+(?:\.\d+)?)/);
  if (multi) {
    return parseFloat(multi[1]) * parseFloat(multi[2]);
  }

  // 取最後一個數字
  const nums = str.match(/(\d+(?:\.\d+)?)/g);
  if (nums && nums.length > 0) {
    return Math.round(parseFloat(nums[nums.length - 1]));
  }

  return 0;
}

/**
 * 複製文字到剪貼簿
 */
export async function copyToClipboard(text) {
  // 現代 Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('[Clipboard] Modern API failed, trying fallback:', err);
    }
  }

  // Fallback 方法
  return fallbackCopyText(text);
}

/**
 * Fallback 複製方法
 */
function fallbackCopyText(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();

  try {
    const success = document.execCommand('copy');
    document.body.removeChild(ta);
    return success;
  } catch (e) {
    document.body.removeChild(ta);
    return false;
  }
}

/**
 * 深拷貝陣列
 */
export function cloneArray(arr) {
  if (!Array.isArray(arr)) return [];
  return JSON.parse(JSON.stringify(arr));
}

/**
 * 檢查兩個陣列是否相等（順序敏感）
 */
export function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}

/**
 * 安全地從陣列中移除元素
 */
export function removeFromArray(arr, value) {
  return arr.filter(item => item !== value);
}

/**
 * 安全地切換陣列中的元素
 */
export function toggleInArray(arr, value) {
  const index = arr.indexOf(value);
  if (index >= 0) {
    return arr.filter((_, i) => i !== index);
  } else {
    return [...arr, value];
  }
}

/**
 * 確認對話框（帶預設訊息）
 */
export function confirmAction(message = '確定要執行此操作嗎？') {
  return window.confirm(message);
}

/**
 * 提示對話框
 */
export function promptInput(message, defaultValue = '') {
  return window.prompt(message, defaultValue);
}

/**
 * 警告對話框
 */
export function alertMessage(message) {
  window.alert(message);
}

/**
 * 中文排序
 */
export function chineseSort(a, b) {
  return a.localeCompare(b, 'zh-Hant-TW');
}
