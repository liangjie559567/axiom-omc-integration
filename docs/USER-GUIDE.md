# Axiom-OMC 整合项目 - 使用指南

**版本**: 1.0.0
**更新时间**: 2026-02-17

---

## 📚 目录

1. [快速开始](#快速开始)
2. [核心概念](#核心概念)
3. [使用场景](#使用场景)
4. [最佳实践](#最佳实践)
5. [常见问题](#常见问题)
6. [故障排查](#故障排查)

---

## 快速开始

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd axiom-omc-integration

# 安装依赖
npm install

# 运行测试
npm test
```

### 基本使用

```javascript
import { createAgentSystem } from './src/agents/agent-system.js';
import { createMemorySystem } from './src/core/memory-system.js';
import { createWorkflowIntegration } from './src/core/workflow-integration.js';

// 1. 初始化系统
const agentSystem = createAgentSystem();
const memorySystem = createMemorySystem();
const workflowIntegration = createWorkflowIntegration();

await memorySystem.initialize();

// 2. 启动工作流
const workflowId = workflowIntegration.startWorkflow('omc-default', {
  projectName: 'My Project'
});

// 3. 执行 Agent
const executionId = await agentSystem.execute('architect', {
  task: 'Design system architecture'
});

// 4. 记录决策
memorySystem.addDecision({
  title: 'Use microservices architecture',
  type: 'architecture',
  status: 'accepted',
  decision: 'Split system into independent services'
});

// 5. 转换工作流阶段
await workflowIntegration.transitionToNext(workflowId);
```

---

## 核心概念

### Agent 系统

Agent 系统是一个智能代理框架，包含 32 个专业 Agent，覆盖软件开发的各个方面。

**核心组件**:
- **AgentRegistry**: Agent 注册表
- **AgentExecutor**: 执行调度器
- **WorkflowEngine**: 工作流编排引擎
- **AgentSystem**: 统一接口

**Agent 分类**:
- **Architect Lane**: 架构设计（architect, designer, planner）
- **Executor Lane**: 代码实现（executor, refactorer, migrator）
- **Reviewer Lane**: 代码审查（api-reviewer, security-reviewer, quality-reviewer）
- **Optimizer Lane**: 性能优化（performance-reviewer, build-fixer）
- **Documenter Lane**: 文档编写（docs-specialist, content-writer）
- **Tester Lane**: 测试（testing-specialist, test-reviewer）

### 命令路由器

命令路由器提供统一的命令管理和路由功能。

**核心功能**:
- 命令注册和管理
- 智能路由
- 冲突检测和解决
- 命令别名支持
- 参数验证
- 权限控制
- 命令历史记录

### 状态同步器

状态同步器负责 Axiom 和 OMC 之间的文件同步。

**核心功能**:
- 文件同步（单向/双向）
- 增量同步（基于 MD5 校验和）
- 冲突检测和解决
- 自动同步机制
- 自定义转换器支持

### 记忆系统

记忆系统管理决策记录和知识图谱。

**核心组件**:
- **DecisionManager**: 决策记录管理
- **KnowledgeGraph**: 知识图谱
- **MemorySystem**: 整合系统

**核心功能**:
- 决策记录追踪
- 知识图谱构建
- 用户偏好管理
- 活动上下文管理
- 自动模式提取

### 工作流整合

工作流整合系统统一管理 Axiom 和 OMC 的工作流。

**核心功能**:
- 工作流定义和注册
- 工作流实例管理
- 阶段转换（顺序/跳跃）
- 转换规则验证
- Axiom ↔ OMC 阶段映射

---

## 使用场景

### 场景 1: 项目启动和架构设计

```javascript
// 1. 启动 OMC 工作流
const workflowId = workflowIntegration.startWorkflow('omc-default', {
  projectName: 'E-commerce Platform',
  team: 'Backend Team'
});

// 2. 执行架构设计 Agent
const architectId = await agentSystem.execute('architect', {
  task: 'Design microservices architecture for e-commerce platform',
  requirements: {
    scalability: 'high',
    availability: '99.9%',
    expectedLoad: '10000 requests/second'
  }
});

// 3. 记录架构决策
memorySystem.addDecision({
  title: 'Use Event-Driven Microservices Architecture',
  type: 'architecture',
  status: 'accepted',
  decision: 'Implement event-driven microservices with message queue',
  rationale: 'Better scalability and loose coupling',
  alternatives: ['Monolithic', 'Service-Oriented Architecture'],
  consequences: [
    'Increased complexity in deployment',
    'Better scalability',
    'Easier to maintain and update individual services'
  ],
  tags: ['architecture', 'microservices', 'scalability']
});

// 4. 在知识图谱中记录架构组件
const serviceNodeId = memorySystem.addKnowledgeNode({
  type: 'module',
  name: 'User Service',
  description: 'Handles user authentication and profile management',
  properties: {
    technology: 'Node.js',
    database: 'PostgreSQL',
    port: 3001
  }
});

// 5. 转换到设计阶段
await workflowIntegration.transitionToNext(workflowId);
```

### 场景 2: API 设计和实现

```javascript
// 1. 执行 API 设计 Agent
const designerId = await agentSystem.execute('designer', {
  task: 'Design RESTful API for user service',
  specifications: {
    endpoints: ['users', 'auth', 'profile'],
    authentication: 'JWT',
    rateLimit: '100 requests/minute'
  }
});

// 2. 记录设计决策
memorySystem.addDecision({
  title: 'Use RESTful API with JWT Authentication',
  type: 'design',
  status: 'accepted',
  decision: 'Implement RESTful API with JWT for authentication',
  rationale: 'Industry standard, easy to implement and maintain',
  alternatives: ['GraphQL', 'gRPC'],
  tags: ['api', 'design', 'authentication']
});

// 3. 转换到实现阶段
await workflowIntegration.transitionToNext(workflowId);

// 4. 执行代码实现 Agent
const executorId = await agentSystem.execute('executor', {
  task: 'Implement user authentication endpoints',
  specifications: {
    endpoints: ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'],
    framework: 'Express.js',
    validation: 'Joi'
  }
});
```

### 场景 3: 代码审查和优化

```javascript
// 1. 执行代码审查 Agent
const reviewerId = await agentSystem.execute('quality-reviewer', {
  task: 'Review user service implementation',
  files: ['src/services/user.js', 'src/controllers/auth.js'],
  criteria: ['code quality', 'best practices', 'security']
});

// 2. 执行安全审查
const securityId = await agentSystem.execute('security-reviewer', {
  task: 'Security audit of authentication system',
  focus: ['SQL injection', 'XSS', 'CSRF', 'authentication bypass']
});

// 3. 记录审查结果
memorySystem.addDecision({
  title: 'Add Input Validation and Rate Limiting',
  type: 'technical',
  status: 'accepted',
  decision: 'Add comprehensive input validation and rate limiting',
  rationale: 'Prevent common security vulnerabilities',
  tags: ['security', 'validation']
});

// 4. 执行性能优化
const optimizerId = await agentSystem.execute('performance-reviewer', {
  task: 'Optimize database queries',
  files: ['src/models/user.js'],
  metrics: ['query time', 'memory usage', 'throughput']
});
```

### 场景 4: 状态同步

```javascript
// 1. 注册同步映射
synchronizer.registerMapping('decisions.md', 'decisions.json', {
  direction: 'bidirectional',
  transformer: async (content, context) => {
    if (context.direction === 'axiom_to_omc') {
      // Markdown → JSON
      const decisions = parseMarkdownDecisions(content);
      return JSON.stringify(decisions, null, 2);
    } else {
      // JSON → Markdown
      const decisions = JSON.parse(content);
      return formatDecisionsAsMarkdown(decisions);
    }
  }
});

// 2. 执行同步
const result = await synchronizer.syncAll();
console.log(`同步完成: 成功 ${result.successful}, 失败 ${result.failed}`);

// 3. 启动自动同步
synchronizer.startAutoSync();
```

### 场景 5: 命令路由

```javascript
// 1. 注册自定义命令
router.register('deploy', async (args, context) => {
  const [environment, version] = args;

  // 执行部署流程
  console.log(`Deploying version ${version} to ${environment}...`);

  // 记录部署决策
  memorySystem.addDecision({
    title: `Deploy v${version} to ${environment}`,
    type: 'process',
    status: 'accepted',
    decision: `Deployed version ${version} to ${environment} environment`,
    tags: ['deployment', environment]
  });

  return { success: true, environment, version };
}, {
  description: '部署应用到指定环境',
  aliases: ['d'],
  validate: (args) => args.length >= 2
});

// 2. 执行命令
const result = await router.route('deploy', ['production', '1.2.0']);
```

---

## 最佳实践

### 1. Agent 使用

#### ✅ 推荐做法

```javascript
// 使用合适的 Agent
const architectId = await agentSystem.execute('architect', {
  task: 'Design system architecture',
  context: { /* 提供足够的上下文 */ }
});

// 等待执行完成
await new Promise(resolve => setTimeout(resolve, 100));

// 获取执行结果
const execution = agentSystem.executor.getExecution(architectId);
```

#### ❌ 不推荐做法

```javascript
// 不要使用错误的 Agent
await agentSystem.execute('executor', {
  task: 'Design architecture' // executor 用于实现，不是设计
});

// 不要忘记等待执行完成
const id = await agentSystem.execute('architect');
const result = agentSystem.executor.getExecution(id); // 可能还未完成
```

### 2. 决策记录

#### ✅ 推荐做法

```javascript
// 记录完整的决策信息
memorySystem.addDecision({
  title: 'Clear and descriptive title',
  type: 'architecture',
  status: 'accepted',
  decision: 'Detailed decision description',
  rationale: 'Why this decision was made',
  alternatives: ['Alternative 1', 'Alternative 2'],
  consequences: ['Consequence 1', 'Consequence 2'],
  tags: ['relevant', 'tags']
});
```

#### ❌ 不推荐做法

```javascript
// 不要记录不完整的决策
memorySystem.addDecision({
  title: 'Decision',
  type: 'technical',
  decision: 'Do something'
  // 缺少 rationale、alternatives 等重要信息
});
```

### 3. 工作流管理

#### ✅ 推荐做法

```javascript
// 按顺序转换阶段
await workflowIntegration.transitionToNext(workflowId);

// 或者跳转到指定阶段（明确指定 skipIntermediate）
await workflowIntegration.transitionTo(
  workflowId,
  'testing',
  { skipIntermediate: true }
);
```

#### ❌ 不推荐做法

```javascript
// 不要跳过验证
await workflowIntegration.transitionTo(workflowId, 'deployment');
// 可能违反转换规则
```

### 4. 错误处理

#### ✅ 推荐做法

```javascript
try {
  const result = await agentSystem.execute('architect');
} catch (error) {
  console.error('Agent 执行失败:', error.message);
  // 记录错误
  memorySystem.addDecision({
    title: 'Agent Execution Failed',
    type: 'process',
    status: 'rejected',
    decision: `Failed to execute architect: ${error.message}`
  });
}
```

#### ❌ 不推荐做法

```javascript
// 不要忽略错误
const result = await agentSystem.execute('architect');
// 如果失败，程序会崩溃
```

### 5. 资源清理

#### ✅ 推荐做法

```javascript
// 使用完毕后清理资源
synchronizer.destroy();
await memorySystem.destroy();
workflowIntegration.destroy();
```

#### ❌ 不推荐做法

```javascript
// 不要忘记清理资源
// 可能导致内存泄漏
```

---

## 常见问题

### Q1: 如何选择合适的 Agent？

**A**: 根据任务类型选择：
- 架构设计 → `architect`
- API 设计 → `designer`
- 代码实现 → `executor`
- 代码审查 → `quality-reviewer`
- 安全审查 → `security-reviewer`
- 性能优化 → `performance-reviewer`
- 文档编写 → `docs-specialist`

### Q2: 工作流阶段可以回退吗？

**A**: 可以，使用 `transitionTo` 方法：
```javascript
await workflowIntegration.transitionTo(instanceId, 'design');
```

### Q3: 如何处理同步冲突？

**A**: 配置冲突解决策略：
```javascript
const synchronizer = createStateSynchronizer({
  conflictStrategy: 'newer_wins' // 或 'axiom_wins', 'omc_wins', 'manual'
});
```

### Q4: 决策记录可以修改吗？

**A**: 可以，使用 `updateDecision` 方法：
```javascript
memorySystem.updateDecision(decisionId, {
  status: 'deprecated',
  supersededBy: newDecisionId
});
```

### Q5: 如何查看 Agent 执行历史？

**A**: 使用 `getExecutionHistory` 方法：
```javascript
const history = agentSystem.executor.getExecutionHistory({
  agentId: 'architect',
  limit: 10
});
```

---

## 故障排查

### 问题 1: Agent 执行超时

**症状**: Agent 执行时间过长，超过超时限制。

**解决方案**:
```javascript
// 增加超时时间
const agentSystem = createAgentSystem({
  timeout: 600000 // 10 分钟
});
```

### 问题 2: 同步失败

**症状**: 文件同步失败，提示文件不存在。

**解决方案**:
```javascript
// 确保文件路径正确
const axiomPath = path.join(process.cwd(), '.agent', 'file.txt');
const omcPath = path.join(process.cwd(), '.omc', 'file.txt');

// 确保目录存在
await mkdir(path.dirname(axiomPath), { recursive: true });
await mkdir(path.dirname(omcPath), { recursive: true });
```

### 问题 3: 内存使用过高

**症状**: 长时间运行后内存使用持续增长。

**解决方案**:
```javascript
// 定期清理历史记录
agentSystem.executor.cleanupHistory(7 * 24 * 60 * 60 * 1000); // 7 天

// 限制历史记录数量
const router = createCommandRouter({
  maxHistorySize: 500
});
```

### 问题 4: 工作流转换失败

**症状**: 阶段转换被拒绝。

**解决方案**:
```javascript
// 检查转换规则
const workflow = workflowIntegration.workflows.get('omc-default');
console.log(workflow.transitions);

// 使用 skipIntermediate 跳过验证
await workflowIntegration.transitionTo(
  instanceId,
  targetPhase,
  { skipIntermediate: true }
);
```

### 问题 5: 命令冲突

**症状**: 注册命令时提示命令已存在。

**解决方案**:
```javascript
// 使用不同的冲突策略
const router = createCommandRouter({
  conflictStrategy: 'prefix' // 自动添加前缀
});

// 或者先注销旧命令
router.unregister('command-name');
router.register('command-name', handler);
```

---

## 下一步

- 查看 [API 参考文档](./API-REFERENCE.md)
- 查看 [示例代码](../examples/)
- 查看 [测试用例](../tests/)

---

**文档版本**: 1.0.0
**最后更新**: 2026-02-17
