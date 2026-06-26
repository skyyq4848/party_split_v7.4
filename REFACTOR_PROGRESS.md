# 派對分帳神器 v7.4 - 重構進度報告

## 📋 重構目標

- ✅ 模組化架構
- ✅ 移除全域變數
- ⏳ 移除 inline event handlers
- ⏳ 建立 UI 管理層
- ⏳ 單元測試
- ⏳ 文件生成器

---

## ✅ 已完成模組 (Phase 1)

### 1. **storage.js** - LocalStorage 管理
**職責：** 統一管理 LocalStorage 讀寫
**類別：** `StorageManager`

**主要方法：**
- `load(key, defaultValue)` - 讀取並解析 JSON
- `save(key, value)` - 儲存為 JSON
- `loadState()` - 載入完整狀態
- `saveState(state)` - 儲存完整狀態
- `clear()` - 清空所有資料

**優點：**
- 統一錯誤處理
- 避免重複的 JSON.parse/stringify
- 易於測試和 mock

---

### 2. **utils.js** - 工具函數
**職責：** 提供通用工具函數

**主要函數：**
- `floor2(x)` - 金額計算（小數點 2 位）
- `fmtMoney(x)` - 金額格式化
- `escapeHtml(str)` - 防 XSS 跳脫
- `normalizeNames(input)` - 正規化人名輸入
- `parsePrice(str)` - 解析價格（支援表達式）
- `copyToClipboard(text)` - 複製到剪貼簿
- `arraysEqual(a, b)` - 陣列比較
- `chineseSort(a, b)` - 中文排序

**優點：**
- Pure functions，易於測試
- 統一處理邏輯
- 可重用性高

---

### 3. **state.js** - 應用狀態管理
**職責：** 集中管理應用狀態
**類別：** `AppState`

**核心設計：**
- 觀察者模式 (Observer Pattern)
- 不可變更新 (Immutable Updates)
- 自動持久化

**主要方法：**
- `getState()` - 取得當前狀態
- `setState(updates)` - 更新狀態並通知監聽器
- `batchUpdate(fn)` - 批次更新（只觸發一次通知）
- `subscribe(listener)` - 訂閱狀態變更
- `reset()` - 重置所有資料

**便捷方法：**
- `addPerson(name)` / `deletePerson(index)`
- `addGroup(name, members)` / `deleteGroup(index)`
- `addPartyItem(item)` / `updatePartyItem(index, updates)`
- `addPersonalItem(item)` / `deletePersonalItem(index)`
- `addAdvanceItem(item)` / `deleteAdvanceItem(index)`

**優點：**
- 單一資料來源 (Single Source of Truth)
- 狀態變更可追蹤
- 易於實作 undo/redo
- 解耦資料與 UI

---

### 4. **parser.js** - 帳單解析器
**職責：** 解析文字帳單
**類別：** `BillParser`

**主要方法：**
- `parse(text)` - 解析完整文字帳單
- `isCategoryLine(line)` - 判斷分類標題
- `parseAdvance(raw, price, people)` - 解析代付
- `parsePersonal(raw, person, price, payer)` - 解析個人費用
- `parseParty(raw, price, category, people, payer)` - 解析派對費用
- `cleanItemDescription(text)` - 清理品項描述
- `getExample()` - 取得示範範例 (static)

**優點：**
- 單一職責
- 易於擴展解析規則
- 易於測試

---

### 5. **calculator.js** - 結算計算引擎
**職責：** 執行分帳計算
**類別：** `Calculator`

**主要方法：**
- `calculate()` - 完整結算計算
- `initializeBalance(people)` - 初始化餘額
- `calculateStats(...)` - 計算統計資料
- `deductPartyShares(...)` - 扣除派對分攤
- `deductPersonalExpenses(...)` - 扣除個人費用
- `deductAdvanceShares(...)` - 扣除代付分攤
- `addPayerCredits(...)` - 加入付款人收款
- `directedMatching(...)` - 定向配對
- `greedyMatching(...)` - 貪婪配對

**優點：**
- 計算邏輯獨立
- 步驟清晰
- 易於驗證正確性
- 易於優化演算法

---

## ⏳ 待完成模組 (Phase 2)

### 6. **renderer.js** - UI 渲染器
**職責：** 管理 DOM 渲染

**計劃功能：**
- `renderPeopleList()` - 渲染人員清單
- `renderPartyTable()` - 渲染派對費用表格
- `renderPersonalTable()` - 渲染個人費用表格
- `renderAdvanceTable()` - 渲染代付表格
- `renderGroupList()` - 渲染群組清單
- `renderResult(result)` - 渲染結算結果

---

### 7. **event-handler.js** - 事件處理器
**職責：** 統一管理事件綁定

**計劃功能：**
- 移除所有 inline `onclick`/`onchange`
- 使用 Event Delegation
- 統一事件綁定邏輯

---

### 8. **app.js** - 應用主控制器
**職責：** 串接所有模組

**計劃功能：**
```javascript
class App {
  constructor() {
    this.state = new AppState();
    this.parser = new BillParser(this.state);
    this.calculator = new Calculator(this.state);
    this.renderer = new Renderer(this.state);
    this.eventHandler = new EventHandler(this.state, this.renderer);
  }

  init() {
    this.state.subscribe(() => this.renderer.render());
    this.eventHandler.bindEvents();
    this.renderer.render();
  }
}
```

---

## 📊 架構對比

### **原架構**
```
全域變數 (people, party, personal, advance, groups...)
    ↓
Inline Event Handlers (onclick="addPerson()")
    ↓
直接操作 DOM (innerHTML)
    ↓
手動 localStorage 讀寫
```

**問題：**
- 全域污染
- 難以測試
- 狀態分散
- 難以追蹤變更

---

### **新架構**
```
AppState (狀態管理)
    ↓
StorageManager (持久化)
    ↓
BillParser / Calculator (業務邏輯)
    ↓
Renderer (UI 渲染)
    ↓
EventHandler (事件管理)
```

**優點：**
- 模組化
- 單一職責
- 易於測試
- 狀態集中管理
- 可追蹤變更

---

## 🎯 下一步行動

### **Phase 2 - UI 層重構**
1. 建立 `renderer.js`
2. 建立 `event-handler.js`
3. 建立 `app.js` 主控制器
4. 重寫 `index.html` - 移除所有 inline handlers

### **Phase 3 - 測試與優化**
1. 建立單元測試 (Jest / Vitest)
2. 建立整合測試
3. 效能優化
4. 建立 CI/CD

### **Phase 4 - 功能增強**
1. 資料匯出 (JSON/CSV/Excel)
2. 多幣種支援
3. 歷史記錄
4. PWA 支援（離線可用）

---

## 💡 如何使用新模組

### **範例 1: 新增人員**
```javascript
import { AppState } from './state.js';

const state = new AppState();

// 單一新增
state.addPerson('小明');

// 批次新增
import { normalizeNames } from './utils.js';
const names = normalizeNames('小明, 小華, 小美');
state.addPeople(names);
```

### **範例 2: 解析帳單**
```javascript
import { BillParser } from './parser.js';

const parser = new BillParser(state);
const text = `
藍天 胭脂歐蕾 $78 溫無糖
藍天 出 大布丁 167元
`;
parser.parse(text);
```

### **範例 3: 計算結算**
```javascript
import { Calculator } from './calculator.js';

const calculator = new Calculator(state);
try {
  const result = calculator.calculate();
  console.log(result.balance);
  console.log(result.directedMap);
} catch (error) {
  alert(error.message);
}
```

### **範例 4: 訂閱狀態變更**
```javascript
state.subscribe((newState) => {
  console.log('狀態已更新:', newState);
  // 重新渲染 UI
  renderer.render();
});
```

---

## 📈 重構效益

### **程式碼品質**
- ✅ 降低耦合度
- ✅ 提高內聚性
- ✅ 易於維護

### **開發體驗**
- ✅ 程式碼補全 (IDE 支援)
- ✅ 型別推斷
- ✅ 易於 debug

### **測試性**
- ✅ Pure functions 易於測試
- ✅ Mock 依賴簡單
- ✅ 測試覆蓋率可量化

### **擴展性**
- ✅ 新增功能不影響既有程式碼
- ✅ 模組可獨立替換
- ✅ 支援大型重構

---

## 🚀 立即開始

執行以下命令繼續 Phase 2：

```bash
# 建立 renderer.js
# 建立 event-handler.js
# 建立 app.js
# 更新 index.html
```

或者先測試現有模組：

```bash
# 在瀏覽器 console 中測試
import { AppState } from './src/state.js';
const state = new AppState();
state.addPerson('測試用戶');
console.log(state.getPeople());
```
