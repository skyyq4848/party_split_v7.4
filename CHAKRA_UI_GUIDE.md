# 派對分帳神器 - Chakra UI 重構方案

## 🎯 技術選型

### **推薦：React + Chakra UI + Vite**

**為什麼選這個組合？**
- ✅ Chakra UI 專為 React 設計，體驗最佳
- ✅ Vite 快速開發，HMR 秒級響應
- ✅ TypeScript 支援完整
- ✅ 與您既有的模組化架構完美契合
- ✅ 社群活躍，文件完整

---

## 📦 專案架構

```
party-split-chakra/
├── src/
│   ├── components/              # UI 元件
│   │   ├── PeopleManager.tsx   # 人員管理
│   │   ├── GroupManager.tsx    # 群組管理
│   │   ├── BillParser.tsx      # 帳單解析
│   │   ├── ExpenseTables.tsx   # 費用表格
│   │   └── ResultDisplay.tsx   # 結果顯示
│   │
│   ├── core/                    # 核心邏輯（重用現有模組）
│   │   ├── storage.js
│   │   ├── utils.js
│   │   ├── state.js
│   │   ├── parser.js
│   │   └── calculator.js
│   │
│   ├── hooks/                   # React Hooks
│   │   ├── useAppState.ts
│   │   ├── useCalculator.ts
│   │   └── useBillParser.ts
│   │
│   ├── theme/                   # Chakra UI 主題
│   │   └── index.ts
│   │
│   ├── App.tsx                  # 主應用
│   └── main.tsx                 # 入口
│
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🚀 快速開始

### **方案 A: 全新 React 專案（推薦）**

```bash
# 1. 建立 Vite + React + TypeScript 專案
npm create vite@latest party-split-chakra -- --template react-ts

# 2. 進入專案
cd party-split-chakra

# 3. 安裝 Chakra UI
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion

# 4. 安裝其他依賴
npm install

# 5. 啟動開發伺服器
npm run dev
```

### **方案 B: Vue 3 + Chakra UI Vue（次選）**

```bash
# 1. 建立 Vite + Vue + TypeScript 專案
npm create vite@latest party-split-vue -- --template vue-ts

# 2. 進入專案
cd party-split-vue

# 3. 安裝 Chakra UI Vue
npm install @chakra-ui/vue-next @emotion/css

# 4. 啟動開發伺服器
npm run dev
```

---

## 📝 React + Chakra UI 範例程式碼

### **1. 主應用 (App.tsx)**

\`\`\`tsx
import { ChakraProvider, Container, VStack, Heading, Badge, useColorMode, IconButton } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { AppStateProvider } from './hooks/useAppState';
import PeopleManager from './components/PeopleManager';
import GroupManager from './components/GroupManager';
import BillParser from './components/BillParser';
import ExpenseTables from './components/ExpenseTables';
import ResultDisplay from './components/ResultDisplay';
import theme from './theme';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AppStateProvider>
        <AppContent />
      </AppStateProvider>
    </ChakraProvider>
  );
}

function AppContent() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <HStack justify="space-between" pb={4} borderBottomWidth={1}>
          <HStack>
            <Heading size="xl">🎉 派對分帳神器</Heading>
            <Badge colorScheme="purple" fontSize="md">v7.4</Badge>
          </HStack>
          <IconButton
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            aria-label="Toggle color mode"
          />
        </HStack>

        {/* 主要內容 */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <PeopleManager />
          <GroupManager />
        </SimpleGrid>

        <BillParser />
        <ExpenseTables />
        <ResultDisplay />
      </VStack>
    </Container>
  );
}

export default App;
\`\`\`

---

### **2. 人員管理元件 (PeopleManager.tsx)**

\`\`\`tsx
import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  List,
  ListItem,
  IconButton,
  Tag,
  Textarea,
  Collapse,
  useDisclosure
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { useAppState } from '../hooks/useAppState';

export default function PeopleManager() {
  const { state, addPerson, deletePerson, addPeople } = useAppState();
  const [name, setName] = useState('');
  const [bulkNames, setBulkNames] = useState('');
  const { isOpen, onToggle } = useDisclosure();

  const handleAdd = () => {
    if (addPerson(name)) {
      setName('');
    }
  };

  const handleBulkAdd = () => {
    const names = bulkNames
      .split(/[,，\\s\\n]+/)
      .map(n => n.trim())
      .filter(Boolean);
    addPeople(names);
    setBulkNames('');
    onToggle();
  };

  return (
    <Box
      bg="white"
      p={6}
      borderRadius="lg"
      shadow="md"
      _hover={{ shadow: 'lg' }}
      transition="all 0.2s"
    >
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Heading size="md">👥 參加人員管理</Heading>
          <Tag colorScheme="blue">{state.people.length} 人</Tag>
        </HStack>

        {/* 單一新增 */}
        <HStack>
          <Input
            placeholder="輸入人名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            onClick={handleAdd}
          >
            新增
          </Button>
        </HStack>

        {/* 批次匯入 */}
        <Button variant="outline" onClick={onToggle}>
          📋 批次匯入
        </Button>
        <Collapse in={isOpen}>
          <VStack spacing={2}>
            <Textarea
              placeholder="輸入多位人名（逗號、空白或換行分隔）"
              value={bulkNames}
              onChange={(e) => setBulkNames(e.target.value)}
              rows={3}
            />
            <HStack w="full">
              <Button colorScheme="green" onClick={handleBulkAdd} flex={1}>
                確認匯入
              </Button>
              <Button variant="ghost" onClick={onToggle}>
                取消
              </Button>
            </HStack>
          </VStack>
        </Collapse>

        {/* 人員清單 */}
        <Divider />
        <List spacing={2}>
          {state.people.map((person, idx) => (
            <ListItem key={idx}>
              <HStack
                justify="space-between"
                p={2}
                borderRadius="md"
                _hover={{ bg: 'gray.50' }}
                transition="background 0.2s"
              >
                <Text>{person}</Text>
                <IconButton
                  icon={<DeleteIcon />}
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  onClick={() => deletePerson(idx)}
                  aria-label="刪除"
                />
              </HStack>
            </ListItem>
          ))}
        </List>

        {state.people.length === 0 && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            尚未新增任何人員
          </Alert>
        )}
      </VStack>
    </Box>
  );
}
\`\`\`

---

### **3. 自訂 Hook (useAppState.ts)**

\`\`\`tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState } from '../core/state';

// 建立 Context
const AppStateContext = createContext<{
  state: ReturnType<typeof AppState.prototype.getState>;
  appState: AppState;
  addPerson: (name: string) => boolean;
  deletePerson: (idx: number) => boolean;
  addPeople: (names: string[]) => number;
  // ... 其他方法
} | null>(null);

// Provider
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [appState] = useState(() => new AppState());
  const [state, setState] = useState(appState.getState());

  useEffect(() => {
    // 訂閱狀態變更
    const unsubscribe = appState.subscribe((newState) => {
      setState({ ...newState });
    });

    return unsubscribe;
  }, [appState]);

  const value = {
    state,
    appState,
    addPerson: (name: string) => appState.addPerson(name),
    deletePerson: (idx: number) => appState.deletePerson(idx),
    addPeople: (names: string[]) => appState.addPeople(names),
    // ... 其他方法
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

// Hook
export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}
\`\`\`

---

### **4. Chakra UI 主題自訂 (theme/index.ts)**

\`\`\`tsx
import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
};

const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: '#EBF8FF',
      100: '#BEE3F8',
      500: '#3182CE',
      600: '#2C5282',
      700: '#2A4365',
    },
  },
  fonts: {
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'blue',
      },
    },
  },
});

export default theme;
\`\`\`

---

## 🎨 Chakra UI 核心元件

### **常用元件速查**

\`\`\`tsx
// Layout
<Container maxW="container.xl">
<Box p={4} bg="white" borderRadius="lg">
<VStack spacing={4}>
<HStack spacing={4}>
<SimpleGrid columns={2} spacing={6}>

// Typography
<Heading size="xl">標題</Heading>
<Text fontSize="lg">內文</Text>

// Form
<Input placeholder="輸入..." />
<Textarea />
<Select>
<Checkbox>
<Radio>

// Button
<Button colorScheme="blue">按鈕</Button>
<IconButton icon={<AddIcon />} />

// Feedback
<Alert status="success">
<Toast>
<Spinner>

// Data Display
<Table variant="simple">
<Tag colorScheme="green">標籤</Tag>
<Badge>徽章</Badge>

// Overlay
<Modal>
<Drawer>
<Tooltip>
\`\`\`

---

## 🔄 整合現有模組

您現有的模組可以直接重用！

\`\`\`tsx
// 直接匯入
import { AppState } from './core/state.js';
import { BillParser } from './core/parser.js';
import { Calculator } from './core/calculator.js';

// 在 React 中使用
const appState = new AppState();
const parser = new BillParser(appState);
const calculator = new Calculator(appState);
\`\`\`

---

## 📋 完整 package.json

\`\`\`json
{
  "name": "party-split-chakra",
  "version": "7.4.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@chakra-ui/icons": "^2.1.1",
    "@chakra-ui/react": "^2.8.2",
    "@emotion/react": "^11.11.3",
    "@emotion/styled": "^11.11.0",
    "framer-motion": "^11.0.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.0"
  }
}
\`\`\`

---

## 🎯 下一步行動

### **立即開始**

我可以幫您：

1. **建立完整的 React + Chakra UI 專案**
   - 完整的元件架構
   - 所有功能完整實作
   - TypeScript 支援

2. **或建立 Vue 3 + Chakra UI Vue 專案**
   - Vue 3 Composition API
   - TypeScript 支援

3. **建立漸進式遷移計劃**
   - 保留現有功能
   - 逐步轉換到 React/Vue

**您想要哪個方案？**

1️⃣ 完整 React + Chakra UI 專案（推薦）  
2️⃣ Vue 3 + Chakra UI Vue 專案  
3️⃣ 只要純 CSS 的 Chakra UI 風格（已完成 index-chakra.html）

---

## 💡 優勢總結

### **React + Chakra UI**
- ✅ 元件最豐富
- ✅ 社群最活躍
- ✅ 文件最完整
- ✅ 與您的模組化架構完美契合
- ✅ 開發體驗極佳

### **現有模組重用**
- ✅ 核心邏輯無需改寫
- ✅ 只需建立 UI 層
- ✅ 測試覆蓋率保持

---

需要我立即建立完整專案嗎？🚀
