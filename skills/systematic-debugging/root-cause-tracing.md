# 根因追踪技术

## 核心原则

**向后追踪调用链，直到找到原始触发点，然后在源头修复。**

不要在症状出现的地方修复，要在问题产生的地方修复。

---

## 追踪流程

### 步骤 1: 观察症状

```
症状: 用户看到 "undefined" 错误消息
位置: UI 组件显示错误
```

**不要在这里修复。** 这只是症状。

---

### 步骤 2: 找到直接原因

```typescript
// UI 组件
function ErrorDisplay({ error }) {
  return <div>{error.message}</div>;
  // 问题: error.message 是 undefined
}
```

**问题**: `error.message` 是 undefined

**不要在这里修复。** 这还不是根因。

---

### 步骤 3: 询问"什么调用了这个？"

```typescript
// 错误处理器
function handleError(error) {
  showError({
    message: error.msg  // ❌ 应该是 error.message
  });
}
```

**发现**: 使用了错误的属性名 `error.msg` 而不是 `error.message`

**不要在这里修复。** 继续追踪。

---

### 步骤 4: 继续向上追踪

```typescript
// API 调用
async function fetchData() {
  try {
    const response = await api.get('/data');
    return response.data;
  } catch (err) {
    handleError(err);  // 传递原始错误对象
  }
}
```

**发现**: 传递的是原始错误对象，但 `handleError` 期望特定格式

**继续追踪。**

---

### 步骤 5: 找到原始触发点

```typescript
// API 客户端
class ApiClient {
  async get(url) {
    try {
      return await fetch(url);
    } catch (networkError) {
      // ❌ 原始触发点：抛出的错误对象格式不一致
      throw networkError;  // 浏览器原生错误，没有 .message
    }
  }
}
```

**根因找到**: API 客户端抛出的错误对象格式不一致。

---

### 步骤 6: 在源头修复

```typescript
// ✅ 在原始触发点修复
class ApiClient {
  async get(url) {
    try {
      return await fetch(url);
    } catch (networkError) {
      // ✅ 标准化错误格式
      throw {
        message: networkError.message || '网络请求失败',
        code: 'NETWORK_ERROR',
        originalError: networkError
      };
    }
  }
}
```

**结果**: 所有下游代码自动修复，因为错误格式现在一致了。

---

## 完整追踪示例

### 案例: 空 projectDir Bug

#### 症状

```
错误: Cannot read property 'length' of undefined
位置: src/utils/path-validator.ts:15
```

#### 追踪过程

```
症状: path-validator 中 undefined.length
  ↓
直接原因: projectDir 是 undefined
  ↓
调用者: ConfigManager.getProjectDir() 返回 undefined
  ↓
更上层: ConfigManager 初始化时没有设置 projectDir
  ↓
根本原因: 启动脚本没有传递 --project-dir 参数
```

#### 修复策略

使用 **防御深度** 在多个层级修复：

```typescript
// 层级 1: 启动脚本（根因）
// ✅ 确保总是传递 project-dir
const projectDir = process.cwd();
spawn('axiom', ['--project-dir', projectDir]);

// 层级 2: ConfigManager（业务逻辑）
// ✅ 验证配置完整性
class ConfigManager {
  constructor(options) {
    if (!options.projectDir) {
      throw new ConfigError('projectDir 是必需的');
    }
    this.projectDir = options.projectDir;
  }
}

// 层级 3: path-validator（函数级）
// ✅ 防御性编程
function validatePath(projectDir, path) {
  if (!projectDir) {
    throw new Error('projectDir 不能为空');
  }
  if (projectDir.length === 0) {
    throw new Error('projectDir 不能是空字符串');
  }
  // 正常验证逻辑
}

// 层级 4: 调试插桩
// ✅ 添加监控
logger.debug('路径验证', {
  projectDir,
  projectDirType: typeof projectDir,
  projectDirLength: projectDir?.length
});
```

---

## 堆栈跟踪插桩

### 技术 1: 添加调用链日志

```typescript
function processData(data) {
  console.log('processData 调用', {
    data,
    caller: new Error().stack.split('\n')[2]  // 获取调用者
  });

  // 处理逻辑
}
```

### 技术 2: 包装函数追踪

```typescript
function trace(fn, name) {
  return function(...args) {
    console.log(`进入 ${name}`, args);
    try {
      const result = fn.apply(this, args);
      console.log(`退出 ${name}`, result);
      return result;
    } catch (error) {
      console.error(`${name} 错误`, error);
      throw error;
    }
  };
}

// 使用
const processData = trace(originalProcessData, 'processData');
```

### 技术 3: 错误边界追踪

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // 记录完整的组件堆栈
    console.error('组件错误', {
      error,
      componentStack: errorInfo.componentStack,
      // 追踪到触发组件
      triggerComponent: errorInfo.componentStack.split('\n')[1]
    });
  }
}
```

---

## 追踪模式

### 模式 1: 数据流追踪

```typescript
// 追踪数据如何变化
function traceDataFlow(data, operation) {
  const snapshot = {
    before: JSON.stringify(data),
    operation,
    timestamp: Date.now()
  };

  // 执行操作
  const result = operation(data);

  snapshot.after = JSON.stringify(result);
  console.log('数据流', snapshot);

  return result;
}
```

### 模式 2: 状态变化追踪

```typescript
// 追踪状态如何改变
class StatefulObject {
  private state: any;
  private stateHistory: any[] = [];

  setState(newState) {
    this.stateHistory.push({
      from: this.state,
      to: newState,
      stack: new Error().stack,
      timestamp: Date.now()
    });

    this.state = newState;
  }

  getStateHistory() {
    return this.stateHistory;
  }
}
```

### 模式 3: 事件追踪

```typescript
// 追踪事件触发链
class EventTracer {
  private events: any[] = [];

  trace(eventName, data) {
    this.events.push({
      name: eventName,
      data,
      stack: new Error().stack,
      timestamp: Date.now()
    });
  }

  getEventChain() {
    return this.events.map(e => e.name).join(' → ');
  }
}
```

---

## 实际案例

### 案例 1: 测试失败追踪

```
症状: 测试间歇性失败
  ↓
直接原因: 断言在数据到达前执行
  ↓
调用者: 测试使用 setTimeout(50) 等待
  ↓
更上层: 异步操作有时需要 >50ms
  ↓
根本原因: 使用任意超时而非条件等待
```

**修复**: 使用条件等待（参见 `condition-based-waiting.md`）

```typescript
// ❌ 之前：猜测时间
await new Promise(r => setTimeout(r, 50));

// ✅ 之后：等待条件
await waitFor(() => getData() !== undefined);
```

---

### 案例 2: 内存泄漏追踪

```
症状: 内存使用持续增长
  ↓
直接原因: 事件监听器未清理
  ↓
调用者: 组件卸载时没有调用 cleanup
  ↓
更上层: useEffect 没有返回清理函数
  ↓
根本原因: 开发者不知道需要清理
```

**修复**: 添加清理逻辑和文档

```typescript
// ✅ 正确的 useEffect 模式
useEffect(() => {
  const handler = (data) => setData(data);
  eventBus.on('data', handler);

  // ✅ 清理函数
  return () => {
    eventBus.off('data', handler);
  };
}, []);
```

---

### 案例 3: 性能问题追踪

```
症状: 页面渲染慢
  ↓
直接原因: 组件重新渲染频繁
  ↓
调用者: 父组件状态频繁更新
  ↓
更上层: 每次鼠标移动都更新状态
  ↓
根本原因: 没有使用防抖/节流
```

**修复**: 在事件源头添加防抖

```typescript
// ✅ 在原始触发点修复
const handleMouseMove = debounce((e) => {
  setMousePosition({ x: e.clientX, y: e.clientY });
}, 100);
```

---

## 追踪工具

### 工具 1: Chrome DevTools

```javascript
// 使用 console.trace() 查看调用栈
function suspiciousFunction() {
  console.trace('suspiciousFunction 被调用');
  // ...
}
```

### 工具 2: Node.js 调试器

```bash
# 启动调试器
node --inspect-brk app.js

# 在 Chrome 中打开
chrome://inspect
```

### 工具 3: 日志聚合

```typescript
// 结构化日志便于追踪
logger.info('操作执行', {
  operation: 'processData',
  input: data,
  userId,
  requestId,
  timestamp: Date.now(),
  stack: new Error().stack
});
```

---

## 记住

**追踪原则：**

1. **不要在症状处修复** - 继续追踪
2. **向后追踪调用链** - 找到原始触发点
3. **在源头修复** - 一次修复，处处受益
4. **添加防御层** - 多层保护
5. **记录追踪过程** - 帮助未来调试

**追踪问题：**

- 这个值从哪里来？
- 谁调用了这个函数？
- 为什么会传递这个参数？
- 最初是谁触发的？

**不要问：**

- 我怎么能让这里不崩溃？（这是修复症状）
- 我能在这里加个检查吗？（这是打补丁）

**要问：**

- 为什么这个值会是错误的？（追踪根因）
- 谁应该负责验证这个？（找到正确的修复位置）

**现在开始追踪根因。**
