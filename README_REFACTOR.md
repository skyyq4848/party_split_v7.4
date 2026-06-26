# 派對分帳神器 v7.4 - 重構版快速入門

## 🎯 重構完成度

- ✅ **Phase 1 完成** - 核心模組重構 (80% 完成)
  - ✅ StorageManager - LocalStorage 管理
  - ✅ Utils - 工具函數
  - ✅ AppState - 狀態管理
  - ✅ BillParser - 帳單解析
  - ✅ Calculator - 結算計算
  
- ⏳ **Phase 2 進行中** - UI 層重構
  - ⏳ Renderer - DOM 渲染
  - ⏳ EventHandler - 事件管理
  - ⏳ App - 主控制器

---

## 📁 專案結構

```
party_split_v7.4/
├── src/                      # 新架構模組（重構版）
│   ├── storage.js           # ✅ LocalStorage 管理
│   ├── utils.js             # ✅ 工具函數
│   ├── state.js             # ✅ 狀態管理
│   ├── parser.js            # ✅ 帳單解析
│   ├── calculator.js        # ✅ 結算計算
│   ├── renderer.js          # ⏳ UI 渲染（待建立）
│   ├── event-handler.js     # ⏳ 事件管理（待建立）
│   └── app.js               # ⏳ 主控制器（待建立）
│
├── party_split_v7.4.js      # 舊版程式碼（原始版本）
├── index.html               # 桌面版頁面
├── index-mob.html           # 行動版頁面
├── index-test.html          # 測試版頁面
│
├── REFACTOR_PROGRESS.md     # 重構進度報告
├── REFACTOR_COMPARISON.md   # 新舊版對比
└── README_REFACTOR.md       # 本文件
```

---

## 🚀 快速開始

### **1. 在瀏覽器 Console 測試新模組**

```javascript
// 匯入模組（需要使用 ES Module）
import { AppState } from './src/state.js';
import { normalizeNames } from './src/utils.js';
import { BillParser } from './src/parser.js';
import { Calculator } from './src/calculator.js';

// 建立應用狀態
const state = new AppState();

// 新增人員
state.addPerson('小明');
state.addPerson('小華');
state.addPerson('小美');

console.log(state.getPeople());
// ['小明', '小華', '小美']
```

### **2. 解析帳單**

```javascript
const parser = new BillParser(state);

const billText = `
藍天 胭脂歐蕾 $78 溫無糖
藍天 熟成榛果歐蕾 $80 微冰無糖
麻煩 熟成歐蕾 $75 常溫無糖
藍天 出 大布丁 167元
`;

parser.parse(billText);

console.log(state.getState());
// 查看解析結果
```

### **3. 計算結算**

```javascript
const calculator = new Calculator(state);

try {
  const result = calculator.calculate();
  
  console.log('餘額:', result.balance);
  console.log('統計:', result.stats);
  console.log('配對:', result.directedMap);
} catch (error) {
  console.error('計算錯誤:', error.message);
}
```

### **4. 訂閱狀態變更**

```javascript
// 監聽狀態變更
const unsubscribe = state.subscribe((newState) => {
  console.log('狀態已更新:', newState);
});

// 測試狀態更新
state.addPerson('阿文');
// → 自動觸發監聽器

// 取消訂閱
unsubscribe();
```

---

## 📚 API 文件

### **AppState**

#### **人員管理**
```javascript
// 新增單一人員
state.addPerson('小明');  // returns boolean

// 批次新增人員
state.addPeople(['小明', '小華', '小美']);  // returns count

// 取得人員清單
state.getPeople();  // returns string[]

// 刪除人員
state.deletePerson(0);  // returns boolean
```

#### **群組管理**
```javascript
// 新增群組
state.addGroup('朋友群', ['小明', '小華']);  // returns boolean

// 刪除群組
state.deleteGroup(0);  // returns boolean

// 更新群組
state.updateGroup(0, { name: '新名稱' });  // returns boolean
```

#### **費用管理**
```javascript
// 新增派對費用
state.addPartyItem({
  cat: '飲料費用',
  item: '珍奶',
  price: 50,
  payer: '小明',
  members: ['小明', '小華']
});

// 更新派對費用
state.updatePartyItem(0, { price: 60 });

// 刪除派對費用
state.deletePartyItem(0);

// 個人費用和代付也有相同的 API
state.addPersonalItem({...});
state.addAdvanceItem({...});
```

#### **設定**
```javascript
// 設定主要付錢人
state.setPrimaryPayer('小明');

// 設定合併代付
state.setConsolidateAdvance(true);

// 設定解析模式
state.setParseMode('manual');  // 'auto' or 'manual'
```

#### **狀態訂閱**
```javascript
// 訂閱狀態變更
const unsubscribe = state.subscribe((newState) => {
  console.log('State changed:', newState);
});

// 取消訂閱
unsubscribe();
```

---

### **BillParser**

```javascript
const parser = new BillParser(state);

// 解析文字帳單
const result = parser.parse(text);
// returns { party: [], personal: [], advance: [] }

// 取得示範範例
const example = BillParser.getExample();
```

---

### **Calculator**

```javascript
const calculator = new Calculator(state);

// 計算結算
const result = calculator.calculate();

// result 包含：
{
  balance: { '小明': 100, '小華': -50 },
  stats: {
    partyShareMap: { '小明': 200 },
    personalTotals: { '小明': 100 },
    advancePaidMap: { '小明': 300 }
  },
  directedMap: { ... },
  pairLines: ['小華 → 小明 50.00'],
  remainingCreditors: [],
  remainingDebtors: []
}
```

---

### **工具函數 (utils.js)**

```javascript
import { 
  floor2,           // 金額取到小數點 2 位
  fmtMoney,         // 金額格式化
  escapeHtml,       // HTML 跳脫
  normalizeNames,   // 正規化人名輸入
  parsePrice,       // 解析價格
  copyToClipboard,  // 複製到剪貼簿
  arraysEqual,      // 陣列比較
  chineseSort       // 中文排序
} from './src/utils.js';

// 金額計算
floor2(123.456);  // 123.45
fmtMoney(123.456);  // "123.46"

// 解析價格
parsePrice('85 * 3');  // 255
parsePrice('珍奶 $50 元');  // 50

// 正規化人名
normalizeNames('小明, 小華  小美');  // ['小明', '小華', '小美']

// HTML 跳脫
escapeHtml('<script>alert("XSS")</script>');
// &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;

// 複製到剪貼簿
await copyToClipboard('測試文字');  // returns boolean
```

---

## 🎨 使用範例

### **範例 1: 完整流程**

```javascript
// 1. 建立應用
const state = new AppState();
const parser = new BillParser(state);
const calculator = new Calculator(state);

// 2. 新增人員
state.addPeople(['小明', '小華', '小美', '阿文']);

// 3. 設定主要付錢人
state.setPrimaryPayer('小明');

// 4. 解析帳單
const billText = BillParser.getExample();
parser.parse(billText);

// 5. 計算結算
const result = calculator.calculate();

// 6. 顯示結果
console.log('結算結果:', result.balance);
console.log('配對:', result.pairLines);
```

### **範例 2: 訂閱模式**

```javascript
const state = new AppState();

// 訂閱狀態變更
state.subscribe((newState) => {
  // 自動重新計算
  const calculator = new Calculator(state);
  try {
    const result = calculator.calculate();
    displayResult(result);
  } catch (error) {
    console.warn('無法計算:', error.message);
  }
});

// 任何狀態變更都會自動觸發重新計算
state.addPerson('小明');
state.addPartyItem({...});
```

### **範例 3: 批次更新**

```javascript
// 使用 batchUpdate 避免多次觸發監聽器
state.batchUpdate((s) => {
  s.party = [];
  s.personal = [];
  s.advance = [];
});
// 只觸發一次監聽器
```

---

## 🧪 測試

### **單元測試範例**

```javascript
// test/state.test.js
import { AppState } from '../src/state.js';

describe('AppState', () => {
  let state;

  beforeEach(() => {
    state = new AppState();
    state.reset();  // 清空資料
  });

  test('addPerson should add person to list', () => {
    const result = state.addPerson('小明');
    
    expect(result).toBe(true);
    expect(state.getPeople()).toContain('小明');
  });

  test('addPerson should not add duplicate', () => {
    state.addPerson('小明');
    const result = state.addPerson('小明');
    
    expect(result).toBe(false);
    expect(state.getPeople()).toHaveLength(1);
  });

  test('addPerson should trim whitespace', () => {
    state.addPerson('  小明  ');
    
    expect(state.getPeople()).toContain('小明');
    expect(state.getPeople()).not.toContain('  小明  ');
  });

  test('deletePerson should remove person and related data', () => {
    state.addPerson('小明');
    state.addPersonalItem({ person: '小明', item: '珍奶', price: 50 });
    
    state.deletePerson(0);
    
    expect(state.getPeople()).toHaveLength(0);
    expect(state.getState().personal).toHaveLength(0);
  });

  test('subscribe should notify on state change', () => {
    const listener = jest.fn();
    state.subscribe(listener);
    
    state.addPerson('小明');
    
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
```

---

## 🐛 除錯技巧

### **1. 檢查狀態**
```javascript
// 隨時查看完整狀態
console.log(state.getState());

// 查看特定資料
console.log('人員:', state.getPeople());
console.log('派對費用:', state.getState().party);
```

### **2. 追蹤狀態變更**
```javascript
// 訂閱並記錄所有變更
state.subscribe((newState) => {
  console.log('State changed:', newState);
  console.trace();  // 顯示呼叫堆疊
});
```

### **3. 驗證計算**
```javascript
// 計算前後對比
const before = state.getState();
const calculator = new Calculator(state);
const result = calculator.calculate();

console.log('Before:', before);
console.log('Result:', result);
```

---

## 📖 延伸閱讀

- **REFACTOR_PROGRESS.md** - 重構進度詳細報告
- **REFACTOR_COMPARISON.md** - 新舊版詳細對比
- **party_split_v7.4.js** - 原始程式碼（舊版）

---

## 💡 最佳實踐

### **1. 永遠使用狀態管理**
```javascript
// ❌ 不要直接修改
state.state.people.push('小明');

// ✅ 使用提供的方法
state.addPerson('小明');
```

### **2. 使用訂閱更新 UI**
```javascript
// ✅ 自動同步
state.subscribe((newState) => {
  renderer.render(newState);
});
```

### **3. 錯誤處理**
```javascript
try {
  const result = calculator.calculate();
} catch (error) {
  alert(error.message);
}
```

### **4. 批次操作**
```javascript
// ✅ 批次更新
state.batchUpdate((s) => {
  // 多個修改
  s.people = [];
  s.party = [];
  s.personal = [];
  s.advance = [];
});
// 只觸發一次監聽器和一次儲存
```

---

## 🎯 下一步

1. **完成 Phase 2** - 建立 renderer.js 和 event-handler.js
2. **建立測試** - 完整的單元測試套件
3. **遷移 UI** - 將舊版 HTML 改用新架構
4. **文件生成** - 自動產生 API 文件
5. **TypeScript 升級** - 加入型別安全

---

有問題或建議？歡迎提出！🎉
