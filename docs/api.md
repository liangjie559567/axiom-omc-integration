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

---

## 工作流集成模块 (v1.0.1)

### PhaseMapper

阶段映射器，负责在不同工作流系统之间映射阶段。

#### 构造函数

```javascript
import { PhaseMapper } from './core/phase-mapper.js';

const phaseMapper = new PhaseMapper();
```

#### 方法

##### registerRule(rule)

注册映射规则。

**参数：**
- `rule` (Object) - 映射规则对象
  - `from` (string) - 源阶段名称（必需）
  - `to` (string[]) - 目标阶段名称数组（必需）
  - `condition` (Function) - 条件函数（可选）
  - `weight` (number) - 权重，默认 1（可选）
  - `metadata` (Object) - 元数据（可选）

**返回值：** `string` - 规则 ID

**示例：**
```javascript
// 简单映射
const ruleId = phaseMapper.registerRule({
  from: 'review',
  to: ['design']
});

// 条件映射
phaseMapper.registerRule({
  from: 'testing',
  to: ['qa-testing'],
  condition: (context) => context.testType === 'integration',
  weight: 2
});

// 一对多映射
phaseMapper.registerRule({
  from: 'implement',
  to: ['implementation', 'testing']
});
```

##### map(fromPhase, context)

映射源阶段到目标阶段。

**参数：**
- `fromPhase` (string) - 源阶段名称（必需）
- `context` (Object) - 上下文对象（可选）

**返回值：** `string[]` - 目标阶段名称数组（按权重排序）

**性能：** O(1) 时间复杂度（使用索引优化）

**示例：**
```javascript
const targets = phaseMapper.map('review');
// 返回: ['design']

const targets = phaseMapper.map('testing', {
  testType: 'integration'
});
// 返回: ['qa-testing']
```

##### reverseMap(toPhase)

反向映射：查找映射到指定目标阶段的所有源阶段。

**参数：**
- `toPhase` (string) - 目标阶段名称（必需）

**返回值：** `string[]` - 源阶段名称数组

##### deleteRule(ruleId)

删除映射规则。

**参数：**
- `ruleId` (string) - 规则 ID（必需）

**返回值：** `boolean` - 是否成功删除

##### clearRules()

清除所有映射规则。

##### getAllRules()

获取所有映射规则。

**返回值：** `Array<Object>` - 规则对象数组

##### getStats()

获取统计信息。

**返回值：** `Object` - 统计信息对象
- `totalRules` (number) - 总规则数
- `totalMappings` (number) - 总映射次数
- `successfulMappings` (number) - 成功映射次数
- `failedMappings` (number) - 失败映射次数

---

### WorkflowIntegration

工作流整合系统，管理 Axiom 和 OMC 工作流。

#### 构造函数

```javascript
import { WorkflowIntegration } from './core/workflow-integration.js';

const workflowIntegration = new WorkflowIntegration(config);
```

**参数：**
- `config` (Object) - 配置选项（可选）
  - `defaultWorkflowType` (string) - 默认工作流类型，默认 'omc'
  - `enableAutoTransition` (boolean) - 启用自动转换，默认 true
  - `enableValidation` (boolean) - 启用验证，默认 true

#### 方法

##### registerWorkflow(workflow)

注册工作流定义。

**参数：**
- `workflow` (Object) - 工作流定义对象
  - `id` (string) - 工作流 ID（可选，自动生成）
  - `name` (string) - 工作流名称（必需）
  - `type` (string) - 工作流类型（必需）
  - `phases` (string[]) - 阶段列表（必需）
  - `transitions` (Object) - 转换规则（可选）

**返回值：** `string` - 工作流 ID

##### startWorkflow(workflowId, context)

启动工作流实例。

**参数：**
- `workflowId` (string) - 工作流 ID（必需）
- `context` (Object) - 初始上下文（可选）

**返回值：** `string` - 实例 ID

**示例：**
```javascript
const instanceId = workflowIntegration.startWorkflow('omc-default', {
  projectName: 'My Project',
  team: 'Backend Team'
});
```

##### transitionTo(instanceId, targetPhase, options)

转换工作流到指定阶段。

**参数：**
- `instanceId` (string) - 实例 ID（必需）
- `targetPhase` (string) - 目标阶段（必需）
- `options` (Object) - 选项（可选）
  - `skipIntermediate` (boolean) - 跳过中间阶段，默认 false
  - `metadata` (Object) - 元数据

**返回值：** `Promise<boolean>` - 是否成功转换

##### transitionToNext(instanceId)

转换到下一个阶段。

**参数：**
- `instanceId` (string) - 实例 ID（必需）

**返回值：** `Promise<boolean>` - 是否成功转换

##### getWorkflowInstance(instanceId)

获取工作流实例。

**参数：**
- `instanceId` (string) - 实例 ID（必需）

**返回值：** `Object|null` - 实例对象或 null

##### getActiveWorkflows()

获取所有活跃的工作流实例。

**返回值：** `Array<Object>` - 实例对象数组

##### getStats()

获取统计信息。

**返回值：** `Object` - 统计信息对象
- `totalWorkflows` (number) - 总工作流数
- `activeWorkflows` (number) - 活跃工作流数
- `completedWorkflows` (number) - 完成工作流数
- `totalTransitions` (number) - 总转换次数

#### 事件

```javascript
// 工作流启动
workflowIntegration.on('workflowStarted', (event) => {
  console.log('工作流已启动:', event.instanceId);
});

// 阶段转换
workflowIntegration.on('phaseTransitioned', (event) => {
  console.log('阶段已转换:', event.from, '->', event.to);
});

// 工作流完成
workflowIntegration.on('workflowCompleted', (event) => {
  console.log('工作流已完成:', event.instanceId);
});
```

---

### AutoSyncEngine

自动同步引擎，负责工作流之间的自动同步。

#### 构造函数

```javascript
import { AutoSyncEngine } from './core/auto-sync-engine.js';

const syncEngine = new AutoSyncEngine(workflowIntegration, phaseMapper, options);
```

**参数：**
- `workflowIntegration` (WorkflowIntegration) - 工作流整合实例（必需）
- `phaseMapper` (PhaseMapper) - 阶段映射器实例（必需）
- `options` (Object) - 配置选项（可选）
  - `maxHistorySize` (number) - 最大历史记录数，默认 1000

#### 方法

##### start()

启动自动同步。

**示例：**
```javascript
syncEngine.start();
console.log(syncEngine.isRunning); // true
```

##### stop()

停止自动同步。

##### linkWorkflows(sourceId, targetId, options)

建立工作流同步关系。

**参数：**
- `sourceId` (string) - 源工作流实例 ID（必需）
- `targetId` (string) - 目标工作流实例 ID（必需）
- `options` (Object) - 选项（可选）
  - `strategy` (string) - 同步策略，默认 'master-slave'

**返回值：** `Promise<void>`

**示例：**
```javascript
await syncEngine.linkWorkflows(axiomId, omcId);
```

##### sync(sourceInstanceId, targetInstanceId)

手动触发同步。

**参数：**
- `sourceInstanceId` (string) - 源实例 ID（必需）
- `targetInstanceId` (string) - 目标实例 ID（必需）

**返回值：** `Promise<boolean>` - 是否成功同步

**特性：**
- 自动循环检测
- 跳过相同阶段
- 记录同步历史

##### getLinkedWorkflows(instanceId)

获取关联的工作流。

**参数：**
- `instanceId` (string) - 实例 ID（必需）

**返回值：** `string[]` - 关联的工作流 ID 列表

##### getSyncHistory(filters)

获取同步历史。

**参数：**
- `filters` (Object) - 过滤条件（可选）
  - `instanceId` (string) - 实例 ID（使用索引优化）
  - `success` (boolean) - 成功状态
  - `limit` (number) - 限制数量

**返回值：** `Array<Object>` - 历史记录数组

**性能：**
- 按 `instanceId` 过滤：O(1) 时间复杂度（使用索引）
- 其他过滤：O(n) 时间复杂度

**示例：**
```javascript
// 获取特定实例的历史（使用索引，性能最佳）
const history = syncEngine.getSyncHistory({
  instanceId: axiomId,
  limit: 10
});

// 只获取成功的同步
const successHistory = syncEngine.getSyncHistory({
  success: true
});
```

##### getStats()

获取统计信息。

**返回值：** `Object` - 统计信息对象
- `totalSyncs` (number) - 总同步次数
- `successfulSyncs` (number) - 成功同步次数
- `failedSyncs` (number) - 失败同步次数
- `cyclesDetected` (number) - 检测到的循环次数
- `totalLinks` (number) - 总链接数
- `isRunning` (boolean) - 是否运行中

##### destroy()

清理资源。

#### 事件

```javascript
// 链接创建
syncEngine.on('linkCreated', (link) => {
  console.log('链接已创建:', link.sourceId, '->', link.targetId);
});

// 同步完成
syncEngine.on('syncCompleted', (event) => {
  console.log('同步完成:', event.sourcePhase, '->', event.targetPhase);
});

// 同步失败
syncEngine.on('syncFailed', (event) => {
  console.error('同步失败:', event.error);
});
```

---

### 类型定义

#### WorkflowType

```javascript
export const WorkflowType = {
  AXIOM: 'axiom',
  OMC: 'omc',
  CUSTOM: 'custom'
};
```

#### AxiomPhase

```javascript
export const AxiomPhase = {
  DRAFT: 'draft',
  REVIEW: 'review',
  IMPLEMENT: 'implement'
};
```

#### OMCPhase

```javascript
export const OMCPhase = {
  PLANNING: 'planning',
  DESIGN: 'design',
  IMPLEMENTATION: 'implementation',
  TESTING: 'testing',
  DEPLOYMENT: 'deployment'
};
```

---

### 完整示例

#### 基础工作流同步

```javascript
import { WorkflowIntegration } from './src/core/workflow-integration.js';
import { PhaseMapper } from './src/core/phase-mapper.js';
import { AutoSyncEngine } from './src/core/auto-sync-engine.js';

// 1. 初始化系统
const workflowIntegration = new WorkflowIntegration();
const phaseMapper = new PhaseMapper();
const syncEngine = new AutoSyncEngine(workflowIntegration, phaseMapper);

// 2. 配置映射规则
phaseMapper.registerRule({
  from: 'review',
  to: ['design']
});

// 3. 创建工作流实例
const axiomId = workflowIntegration.startWorkflow('axiom-default', {
  projectName: 'My Project'
});

const omcId = workflowIntegration.startWorkflow('omc-default', {
  projectName: 'My Project'
});

// 4. 建立同步关系
await syncEngine.linkWorkflows(axiomId, omcId);

// 5. 转换阶段（手动同步）
await workflowIntegration.transitionTo(axiomId, 'review');
await syncEngine.sync(axiomId, omcId);

// 6. 验证结果
const omcInstance = workflowIntegration.getWorkflowInstance(omcId);
console.log('OMC 当前阶段:', omcInstance.currentPhase); // 'design'
```

#### 自动同步模式

```javascript
// 1. 启动自动同步
syncEngine.start();

// 2. 监听同步事件
syncEngine.on('syncCompleted', (event) => {
  console.log(`自动同步完成: ${event.sourcePhase} -> ${event.targetPhase}`);
});

// 3. 转换阶段（自动触发同步）
await workflowIntegration.transitionTo(axiomId, 'review');

// 4. 停止自动同步
syncEngine.stop();
```

---

### 性能优化

#### PhaseMapper 性能

- **O(1) 查找**：使用索引优化，支持高频查询
- **基准测试**：901K 查询/秒（100 规则）
- **建议**：避免复杂的条件函数

#### AutoSyncEngine 性能

- **索引查询**：按实例 ID 查询历史记录使用索引，O(1) 时间复杂度
- **基准测试**：9.2M 查询/秒（实例查询）
- **历史限制**：可配置 `maxHistorySize`，默认 1000 条
- **建议**：使用 `instanceId` 过滤以获得最佳性能

---

### 最佳实践

1. **使用手动同步**：对于关键操作，使用 `sync()` 而非自动同步
2. **配置历史限制**：根据内存限制调整 `maxHistorySize`
3. **使用索引查询**：查询历史时始终提供 `instanceId`
4. **监听事件**：使用事件监听器跟踪同步状态
5. **清理资源**：使用完毕后调用 `destroy()`

---

### 参考资料

- [README.md](../README.md) - 项目概览
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 架构设计
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 故障排除
- [示例代码](../examples/) - 完整示例
