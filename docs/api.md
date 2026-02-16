# API 文档

## 核心模块 (Core)

### Logger

日志记录器，用于输出不同级别的日志。

```javascript
import { Logger } from './core/logger.js';

const logger = new Logger('MyModule');

logger.info('信息消息');
logger.warn('警告消息');
logger.error('错误消息');
logger.success('成功消息');
logger.debug('调试消息');
```

#### 方法

- `info(message, data)` - 记录信息
- `warn(message, data)` - 记录警告
- `error(message, data)` - 记录错误
- `success(message, data)` - 记录成功
- `debug(message, data)` - 记录调试信息（需要 DEBUG 环境变量）

### ConfigManager

配置管理器，用于加载和管理配置文件。

```javascript
import { ConfigManager } from './core/config.js';

const config = new ConfigManager();
await config.load();

const value = config.get('app.name');
config.set('app.debug', true);
```

#### 方法

- `load()` - 加载配置文件
- `get(key, defaultValue)` - 获取配置值
- `set(key, value)` - 设置配置值

## 记忆模块 (Memory)

### MemoryManager

记忆管理器，用于管理对话、上下文和知识库。

```javascript
import { MemoryManager } from './memory/index.js';

const memory = new MemoryManager();

// 对话管理
memory.addConversation('conv1', { role: 'user', content: '你好' });
const conv = memory.getConversation('conv1');

// 上下文管理
memory.setContext('user', { id: 1, name: '张三' });
const ctx = memory.getContext('user');

// 知识库管理
memory.addKnowledge({ id: 1, content: 'JavaScript 基础' });
const results = memory.searchKnowledge('JavaScript');
```

#### 方法

- `addConversation(id, message)` - 添加对话消息
- `getConversation(id)` - 获取对话历史
- `setContext(key, value)` - 设置上下文
- `getContext(key)` - 获取上下文
- `addKnowledge(item)` - 添加知识项
- `searchKnowledge(query)` - 搜索知识

## 状态模块 (State)

### StateManager

状态管理器，用于管理应用程序状态。

```javascript
import { StateManager } from './state/index.js';

const state = new StateManager();

// 设置状态
state.setState('user', { id: 1, name: '张三' });

// 获取状态
const user = state.getState('user');

// 获取所有状态
const allState = state.getAllState();

// 监听状态变化
state.on('stateChanged', ({ key, oldValue, newValue }) => {
  console.log(`${key} 从 ${oldValue} 变为 ${newValue}`);
});

// 获取历史记录
const history = state.getHistory('user');

// 重置状态
state.reset();
```

#### 方法

- `setState(key, value)` - 设置状态
- `getState(key)` - 获取状态
- `getAllState()` - 获取所有状态
- `getHistory(key)` - 获取状态变化历史
- `reset()` - 重置所有状态

#### 事件

- `stateChanged` - 状态变化事件
- `stateReset` - 状态重置事件

## Agent 模块 (Agents)

### AgentManager

Agent 管理器，用于注册和执行 Agent。

```javascript
import { AgentManager } from './agents/index.js';

const agentManager = new AgentManager();

// 注册 Agent
class MyAgent {
  async execute(task) {
    return { result: 'success' };
  }
}

agentManager.register('myAgent', new MyAgent());

// 执行 Agent
const result = await agentManager.execute('myAgent', { /* task */ });
```

#### 方法

- `register(name, agent)` - 注册 Agent
- `execute(agentName, task)` - 执行 Agent

## 命令模块 (Commands)

### CommandRegistry

命令注册表，用于注册和执行命令。

```javascript
import { CommandRegistry } from './commands/index.js';

const registry = new CommandRegistry();

// 注册命令
registry.register(
  'hello',
  '打印问候',
  (options) => {
    console.log('你好！');
  }
);

// 执行命令
await registry.execute(process.argv);
```

#### 方法

- `register(name, description, action)` - 注册命令
- `execute(args)` - 执行命令

## 工具模块 (Utils)

### 工具函数

#### delay(ms)

延迟执行指定的毫秒数。

```javascript
import { delay } from './utils/index.js';

await delay(1000); // 延迟 1 秒
```

#### retry(fn, options)

重试执行函数，支持指数退避。

```javascript
import { retry } from './utils/index.js';

const result = await retry(
  async () => {
    // 可能失败的操作
  },
  {
    maxAttempts: 3,
    delayMs: 1000,
    backoff: 2,
  }
);
```

#### deepMerge(target, source)

深度合并两个对象。

```javascript
import { deepMerge } from './utils/index.js';

const result = deepMerge(
  { a: 1, b: { c: 2 } },
  { b: { d: 3 }, e: 4 }
);
// 结果: { a: 1, b: { c: 2, d: 3 }, e: 4 }
```

#### generateId()

生成唯一 ID。

```javascript
import { generateId } from './utils/index.js';

const id = generateId();
```

#### formatTime(ms)

格式化时间。

```javascript
import { formatTime } from './utils/index.js';

console.log(formatTime(500));    // "500ms"
console.log(formatTime(1500));   // "1.50s"
console.log(formatTime(90000));  // "1.50m"
```

## 初始化函数

### initialize()

初始化整个应用程序。

```javascript
import { initialize } from './index.js';

await initialize();
```

### 模块初始化函数

```javascript
import { initializeCore } from './core/index.js';
import { initializeMemory } from './memory/index.js';
import { initializeState } from './state/index.js';
import { initializeAgents } from './agents/index.js';
import { initializeCommands } from './commands/index.js';

await initializeCore();
await initializeMemory();
await initializeState();
await initializeAgents();
await initializeCommands();
```

## 错误处理

所有异步操作都应使用 try-catch 处理错误：

```javascript
try {
  const result = await agentManager.execute('myAgent', task);
} catch (error) {
  logger.error('执行失败', error);
}
```

## 环境变量

- `DEBUG` - 启用调试日志
- `NODE_ENV` - 运行环境（development/production）
