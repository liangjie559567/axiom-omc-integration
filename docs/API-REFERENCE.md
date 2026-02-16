# Axiom-OMC 整合项目 - 完整 API 参考

**版本**: 1.0.0
**更新时间**: 2026-02-17

---

## 📚 目录

1. [Agent 系统](#agent-系统)
2. [命令路由器](#命令路由器)
3. [状态同步器](#状态同步器)
4. [记忆系统](#记忆系统)
5. [工作流整合](#工作流整合)
6. [类型定义](#类型定义)
7. [事件系统](#事件系统)

---

## Agent 系统

### AgentSystem

Agent 系统的主入口，整合了 Agent 注册、执行和工作流编排功能。

#### 创建实例

```javascript
import { createAgentSystem } from './src/agents/agent-system.js';

const agentSystem = createAgentSystem({
  maxConcurrent: 10,      // 最大并发执行数，默认 5
  timeout: 600000,        // 执行超时时间（毫秒），默认 300000
  autoRegister: true      // 是否自动注册所有 Agent，默认 true
});
```

#### 方法

##### execute(agentId, input, options)

执行指定的 Agent。

**参数**:
- `agentId` (String): Agent ID 或名称
- `input` (Object, 可选): 输入参数
- `options` (Object, 可选): 执行选项

**返回**: `Promise<String>` - 执行 ID

**示例**:
```javascript
const executionId = await agentSystem.execute('architect', {
  task: 'Design system architecture',
  context: { projectName: 'My Project' }
});
```

##### executeWorkflow(definition, context)

创建并执行工作流。

**参数**:
- `definition` (Object): 工作流定义
- `context` (Object, 可选): 执行上下文

**返回**: `Promise<Object>` - 执行结果

**示例**:
```javascript
const result = await agentSystem.executeWorkflow({
  name: 'Development Workflow',
  agents: [
    { id: 'architect', input: { task: 'Design' } },
    { id: 'executor', input: { task: 'Implement' } }
  ]
});
```

##### findAgents(criteria)

查询 Agent。

**参数**:
- `criteria` (Object): 查询条件
  - `capability` (String): 按能力查询
  - `type` (String): 按类型查询
  - `model` (String): 按模型查询

**返回**: `Array<Object>` - Agent 列表

**示例**:
```javascript
const agents = agentSystem.findAgents({
  capability: 'code-generation'
});
```

---

## 命令路由器

### CommandRouter

统一的命令路由系统，支持命令注册、路由和冲突解决。

#### 创建实例

```javascript
import { createCommandRouter } from './src/core/command-router.js';

const router = createCommandRouter({
  conflictStrategy: 'prefix',  // 冲突解决策略
  enableHistory: true,         // 是否启用历史记录
  maxHistorySize: 500          // 最大历史记录数
});
```

#### 冲突解决策略

- `'error'`: 抛出错误（默认）
- `'override'`: 覆盖旧命令
- `'prefix'`: 添加前缀
- `'ignore'`: 忽略新命令

#### 方法

##### register(name, handler, options)

注册命令。

**参数**:
- `name` (String): 命令名称
- `handler` (Function): 命令处理函数
- `options` (Object, 可选)
  - `description` (String): 命令描述
  - `aliases` (Array<String>): 命令别名
  - `validate` (Function): 参数验证函数
  - `permission` (String): 所需权限

**返回**: `Boolean` - 是否成功

**示例**:
```javascript
router.register('deploy', async (args, context) => {
  const [environment] = args;
  return { success: true, environment };
}, {
  description: '部署应用',
  aliases: ['d'],
  validate: (args) => args.length > 0
});
```

##### route(commandName, args, context)

路由并执行命令。

**参数**:
- `commandName` (String): 命令名称
- `args` (Array, 可选): 命令参数
- `context` (Object, 可选): 执行上下文

**返回**: `Promise<Any>` - 命令执行结果

**示例**:
```javascript
const result = await router.route('deploy', ['production'], {
  user: 'admin'
});
```

##### getHistory(filters)

获取命令历史。

**参数**:
- `filters` (Object, 可选)
  - `command` (String): 按命令名过滤
  - `limit` (Number): 限制数量

**返回**: `Array<Object>` - 历史记录

**示例**:
```javascript
const history = router.getHistory({
  command: 'deploy',
  limit: 10
});
```

---

## 状态同步器

### StateSynchronizer

Axiom 和 OMC 之间的状态同步系统。

#### 创建实例

```javascript
import { createStateSynchronizer } from './src/core/state-synchronizer.js';

const synchronizer = createStateSynchronizer({
  axiomRoot: '/path/to/.agent',
  omcRoot: '/path/to/.omc',
  conflictStrategy: 'newer_wins',
  autoSync: true,
  syncInterval: 60000
});
```

#### 冲突解决策略

- `'axiom_wins'`: Axiom 优先（默认）
- `'omc_wins'`: OMC 优先
- `'newer_wins'`: 较新的文件优先
- `'manual'`: 手动解决

#### 方法

##### registerMapping(axiomPath, omcPath, options)

注册同步映射。

**参数**:
- `axiomPath` (String): Axiom 文件路径
- `omcPath` (String): OMC 文件路径
- `options` (Object, 可选)
  - `direction` (String): 同步方向
  - `transformer` (Function): 内容转换函数
  - `conflictStrategy` (String): 冲突解决策略

**同步方向**:
- `'axiom_to_omc'`: 单向同步（Axiom → OMC）
- `'omc_to_axiom'`: 单向同步（OMC → Axiom）
- `'bidirectional'`: 双向同步（默认）

**返回**: `String` - 映射 ID

**示例**:
```javascript
synchronizer.registerMapping('config.json', 'config.json', {
  direction: 'bidirectional',
  transformer: async (content, context) => {
    if (context.direction === 'axiom_to_omc') {
      return JSON.stringify(JSON.parse(content), null, 2);
    }
    return content;
  }
});
```

##### syncAll()

同步所有映射。

**返回**: `Promise<Object>` - 同步结果

**示例**:
```javascript
const result = await synchronizer.syncAll();
console.log(`成功: ${result.successful}, 失败: ${result.failed}`);
```

---

## 记忆系统

### MemorySystem

记忆和知识管理系统，整合决策记录和知识图谱。

#### 创建实例

```javascript
import { createMemorySystem } from './src/core/memory-system.js';

const memorySystem = createMemorySystem({
  storageDir: '/path/to/memory',
  enablePatternExtraction: true,
  patternThreshold: 5
});

await memorySystem.initialize();
```

#### 方法

##### addDecision(decision)

添加决策记录。

**参数**:
- `decision` (Object): 决策信息
  - `title` (String): 决策标题
  - `type` (String): 决策类型
  - `status` (String): 决策状态
  - `decision` (String): 决策内容
  - `rationale` (String, 可选): 决策理由
  - `alternatives` (Array, 可选): 备选方案
  - `tags` (Array, 可选): 标签

**返回**: `String` - 决策 ID

**示例**:
```javascript
const decisionId = memorySystem.addDecision({
  title: 'Use PostgreSQL',
  type: 'technical',
  status: 'accepted',
  decision: 'Use PostgreSQL as the primary database',
  rationale: 'Need ACID guarantees',
  alternatives: ['MySQL', 'MongoDB'],
  tags: ['database', 'backend']
});
```

##### queryDecisions(filters)

查询决策记录。

**参数**:
- `filters` (Object, 可选)
  - `type` (String): 按类型过滤
  - `status` (String): 按状态过滤
  - `tags` (Array): 按标签过滤
  - `limit` (Number): 限制数量

**返回**: `Array<Object>` - 决策列表

**示例**:
```javascript
const decisions = memorySystem.queryDecisions({
  type: 'technical',
  status: 'accepted',
  tags: ['database'],
  limit: 10
});
```

##### addKnowledgeNode(node)

添加知识节点。

**参数**:
- `node` (Object): 节点信息
  - `type` (String): 节点类型
  - `name` (String): 节点名称
  - `description` (String, 可选): 描述
  - `properties` (Object, 可选): 属性
  - `tags` (Array, 可选): 标签

**返回**: `String` - 节点 ID

**示例**:
```javascript
const nodeId = memorySystem.addKnowledgeNode({
  type: 'concept',
  name: 'Microservices',
  description: 'Architectural pattern',
  properties: { complexity: 'high' },
  tags: ['architecture']
});
```

##### setPreference(key, value)

设置用户偏好。

**示例**:
```javascript
memorySystem.setPreference('editor', 'vscode');
memorySystem.setPreference('theme', 'dark');
```

---

## 工作流整合

### WorkflowIntegration

Axiom 和 OMC 工作流的统一管理系统。

#### 创建实例

```javascript
import { createWorkflowIntegration } from './src/core/workflow-integration.js';

const integration = createWorkflowIntegration({
  defaultWorkflowType: 'omc',
  enableAutoTransition: true,
  enableValidation: true
});
```

#### 方法

##### startWorkflow(workflowId, context)

启动工作流实例。

**参数**:
- `workflowId` (String): 工作流 ID
- `context` (Object, 可选): 执行上下文

**返回**: `String` - 实例 ID

**示例**:
```javascript
const instanceId = integration.startWorkflow('omc-default', {
  projectName: 'My Project',
  team: 'Backend Team'
});
```

##### transitionToNext(instanceId, options)

转换到下一个阶段。

**返回**: `Promise<Boolean>` - 是否成功

**示例**:
```javascript
const success = await integration.transitionToNext(instanceId);
```

##### transitionTo(instanceId, targetPhase, options)

转换到指定阶段。

**参数**:
- `instanceId` (String): 实例 ID
- `targetPhase` (String): 目标阶段
- `options` (Object, 可选)
  - `skipIntermediate` (Boolean): 是否跳过中间阶段

**返回**: `Promise<Boolean>` - 是否成功

**示例**:
```javascript
const success = await integration.transitionTo(
  instanceId,
  'testing',
  { skipIntermediate: true }
);
```

---

## 类型定义

### DecisionType

```javascript
{
  ARCHITECTURE: 'architecture',
  TECHNICAL: 'technical',
  DESIGN: 'design',
  PROCESS: 'process',
  BUSINESS: 'business'
}
```

### DecisionStatus

```javascript
{
  PROPOSED: 'proposed',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  DEPRECATED: 'deprecated',
  SUPERSEDED: 'superseded'
}
```

### NodeType

```javascript
{
  CONCEPT: 'concept',
  FILE: 'file',
  FUNCTION: 'function',
  CLASS: 'class',
  MODULE: 'module',
  DECISION: 'decision',
  PATTERN: 'pattern'
}
```

### WorkflowType

```javascript
{
  AXIOM: 'axiom',
  OMC: 'omc',
  CUSTOM: 'custom'
}
```

---

## 事件系统

所有核心模块都继承自 EventEmitter，支持事件监听：

```javascript
// Agent 系统事件
agentSystem.executor.on('executionStarted', (execution) => {
  console.log('执行开始:', execution.id);
});

// 命令路由器事件
router.on('commandRegistered', (command) => {
  console.log('命令已注册:', command.name);
});

// 状态同步器事件
synchronizer.on('syncCompleted', (result) => {
  console.log('同步完成:', result);
});

// 记忆系统事件
memorySystem.on('decisionAdded', (decision) => {
  console.log('决策已添加:', decision.title);
});

// 工作流整合事件
integration.on('phaseTransitioned', (event) => {
  console.log('阶段转换:', event.from, '->', event.to);
});
```

---

**文档版本**: 1.0.0
**最后更新**: 2026-02-17
