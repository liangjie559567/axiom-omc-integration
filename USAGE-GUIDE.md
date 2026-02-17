# 使用指南

本指南将帮助你快速上手 Axiom-OMC Integration。

## 目录

- [安装](#安装)
- [基础概念](#基础概念)
- [快速开始](#快速开始)
- [核心组件](#核心组件)
- [常见场景](#常见场景)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

## 安装

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装步骤

```bash
npm install axiom-omc-integration
```

## 基础概念

### 工作流系统

Axiom-OMC Integration 集成了三个工作流系统：

1. **Axiom** - 敏捷开发工作流
2. **OMC** - 传统瀑布式工作流
3. **Superpowers** - 增强功能系统

### 核心组件

1. **PhaseMapper** - 智能映射引擎，自动映射不同工作流的阶段
2. **AutoSyncEngine** - 自动同步引擎，实时同步工作流状态
3. **TemplateManager** - 模板管理器，管理预定义工作流模板
4. **WorkflowOrchestrator** - 工作流协调器，统一管理所有组件

## 快速开始

### 1. 创建协调器

```javascript
import { WorkflowOrchestrator, WorkflowIntegration } from 'axiom-omc-integration';

// 创建工作流集成
const workflowIntegration = new WorkflowIntegration();

// 创建协调器
const orchestrator = new WorkflowOrchestrator(workflowIntegration);
```

### 2. 启动工作流

```javascript
const instance = await orchestrator.startWorkflow('axiom-default', {
  title: '用户认证功能',
  description: '实现用户登录和注册'
});

console.log('工作流已启动:', instance.instanceId);
```

### 3. 创建同步的工作流对

```javascript
const { axiomInstanceId, omcInstanceId } =
  await orchestrator.createSyncedWorkflowPair('axiom-default', 'omc-default', {
    context: {
      feature: 'payment-processing'
    }
  });

console.log('Axiom 实例:', axiomInstanceId);
console.log('OMC 实例:', omcInstanceId);
```

### 4. 使用 TDD 模板

```javascript
const tddInstance = await orchestrator.startTDDWorkflow({
  feature: 'email-validation',
  testFramework: 'jest',
  language: 'javascript'
});

console.log('TDD 工作流已启动:', tddInstance.instanceId);
```

## 核心组件

### PhaseMapper（智能映射引擎）

#### 注册映射规则

```javascript
// 简单映射
orchestrator.registerMappingRule({
  from: 'axiom:draft',
  to: ['omc:planning'],
  weight: 1.0
});

// 条件映射
orchestrator.registerMappingRule({
  from: 'axiom:draft',
  to: ['omc:planning', 'omc:design'],
  weight: 0.9,
  condition: (context) => context.complexity === 'high'
});
```

#### 执行映射

```javascript
// 正向映射
const targetPhases = orchestrator.mapPhase('axiom:draft', {
  complexity: 'high'
});
console.log('目标阶段:', targetPhases);

// 反向映射
const sourcePhases = orchestrator.reverseMapPhase('omc:planning');
console.log('源阶段:', sourcePhases);
```

### AutoSyncEngine（自动同步引擎）

#### 创建同步关系

```javascript
// 自动同步默认启用
const { axiomInstanceId, omcInstanceId } =
  await orchestrator.createSyncedWorkflowPair('axiom-default', 'omc-default');

// Axiom 变化时，OMC 自动同步
await orchestrator.transitionTo(axiomInstanceId, 'axiom:review');
// OMC 自动同步到 omc:design
```

#### 手动同步

```javascript
const success = await orchestrator.syncWorkflows(axiomInstanceId, omcInstanceId);
console.log('同步结果:', success);
```

#### 查看同步历史

```javascript
// 查看所有历史
const allHistory = orchestrator.getSyncHistory();

// 按实例过滤
const instanceHistory = orchestrator.getSyncHistory({
  instanceId: axiomInstanceId
});

// 按成功状态过滤
const successfulSyncs = orchestrator.getSyncHistory({
  success: true
});

// 限制数量
const recentSyncs = orchestrator.getSyncHistory({
  limit: 10
});
```

### TemplateManager（模板管理器）

#### 注册自定义模板

```javascript
const customTemplate = {
  id: 'debug-workflow',
  name: '调试工作流',
  description: '系统化的调试流程',
  workflowId: 'debug-default',
  phases: [
    { id: 'reproduce', name: '重现问题' },
    { id: 'isolate', name: '隔离问题' },
    { id: 'fix', name: '修复问题' },
    { id: 'verify', name: '验证修复' }
  ],
  defaultContext: {
    methodology: 'systematic-debugging'
  }
};

orchestrator.registerTemplate(customTemplate);
```

#### 从模板创建工作流

```javascript
const instance = await orchestrator.createFromTemplate('debug-workflow', {
  context: {
    bug: 'login-timeout-issue'
  }
});
```

### WorkflowOrchestrator（工作流协调器）

#### 工作流转换

```javascript
// 转换到下一个阶段
await orchestrator.transitionToNext(instanceId);

// 转换到指定阶段
await orchestrator.transitionTo(instanceId, 'custom-phase');

// 完成工作流
await orchestrator.completeWorkflow(instanceId);
```

#### 统计信息

```javascript
// 获取统计信息
const stats = orchestrator.getStats();
console.log('PhaseMapper 规则数:', stats.phaseMapper.totalRules);
console.log('AutoSyncEngine 同步次数:', stats.autoSyncEngine.totalSyncs);
console.log('TemplateManager 模板数:', stats.templateManager.totalTemplates);

// 获取性能指标
const metrics = orchestrator.getPerformanceMetrics();
console.log('同步成功率:', metrics.syncSuccessRate + '%');
```

## 常见场景

### 场景 1: TDD 开发新功能

```javascript
// 1. 启动 TDD 工作流
const tddInstance = await orchestrator.startTDDWorkflow({
  feature: 'shopping-cart',
  testFramework: 'jest',
  language: 'javascript'
});

// 2. RED 阶段 - 编写失败的测试
console.log('当前阶段:', tddInstance.currentPhase); // 'red'
// 编写测试用例...

// 3. GREEN 阶段 - 让测试通过
await orchestrator.transitionToNext(tddInstance.instanceId);
// 实现最小代码...

// 4. REFACTOR 阶段 - 重构代码
await orchestrator.transitionToNext(tddInstance.instanceId);
// 优化代码...

// 5. 循环回到 RED，开始下一个功能
await orchestrator.transitionToNext(tddInstance.instanceId);
```

### 场景 2: Axiom 和 OMC 同步开发

```javascript
// 1. 注册映射规则
orchestrator.registerMappingRule({
  from: 'axiom:draft',
  to: ['omc:planning']
});

orchestrator.registerMappingRule({
  from: 'axiom:review',
  to: ['omc:design']
});

orchestrator.registerMappingRule({
  from: 'axiom:implement',
  to: ['omc:implementation']
});

// 2. 创建同步的工作流对
const { axiomInstanceId, omcInstanceId } =
  await orchestrator.createSyncedWorkflowPair('axiom-default', 'omc-default', {
    context: {
      feature: 'payment-processing'
    }
  });

// 3. Axiom 开发流程
await orchestrator.transitionTo(axiomInstanceId, 'axiom:draft');
// OMC 自动同步到 omc:planning

await orchestrator.transitionTo(axiomInstanceId, 'axiom:review');
// OMC 自动同步到 omc:design

await orchestrator.transitionTo(axiomInstanceId, 'axiom:implement');
// OMC 自动同步到 omc:implementation
```

### 场景 3: 使用自定义模板

```javascript
// 1. 定义模板
const codeReviewTemplate = {
  id: 'code-review-workflow',
  name: '代码审查工作流',
  description: '系统化的代码审查流程',
  workflowId: 'code-review-default',
  phases: [
    { id: 'prepare', name: '准备审查' },
    { id: 'review', name: '执行审查' },
    { id: 'discuss', name: '讨论问题' },
    { id: 'approve', name: '批准或拒绝' }
  ],
  defaultContext: {
    methodology: 'code-review'
  }
};

// 2. 注册模板
orchestrator.registerTemplate(codeReviewTemplate);

// 3. 使用模板
const reviewInstance = await orchestrator.createFromTemplate('code-review-workflow', {
  context: {
    pullRequest: 'PR-123',
    reviewer: 'john-doe'
  }
});
```

## 最佳实践

### 1. 映射规则设计

**DO**:
- 使用清晰的命名约定（如 `system:phase`）
- 为复杂映射添加条件函数
- 使用权重控制优先级
- 定期审查和更新映射规则

**DON'T**:
- 避免循环映射
- 不要创建过于复杂的条件
- 不要忽略权重设置

### 2. 同步策略

**DO**:
- 使用主从模式进行单向同步
- 定期检查同步历史
- 监控同步成功率
- 处理同步失败情况

**DON'T**:
- 避免频繁的手动同步
- 不要忽略循环检测警告
- 不要在生产环境禁用自动同步

### 3. 模板使用

**DO**:
- 为常见工作流创建模板
- 使用默认上下文简化使用
- 提供清晰的阶段描述
- 包含使用指南和示例

**DON'T**:
- 避免过于复杂的模板
- 不要硬编码特定值
- 不要忽略模板验证

### 4. 性能优化

**DO**:
- 定期清理历史记录
- 监控性能指标
- 使用批量操作
- 优化映射规则

**DON'T**:
- 避免过多的同步链接
- 不要忽略性能警告
- 不要创建过多的工作流实例

## 故障排除

### 问题 1: 同步失败

**症状**: 工作流同步失败，getSyncHistory 显示失败记录

**原因**:
- 映射规则不存在
- 目标工作流不存在
- 循环同步被检测

**解决方案**:
```javascript
// 1. 检查映射规则
const rules = orchestrator.phaseMapper.getAllRules();
console.log('映射规则:', rules);

// 2. 检查工作流实例
const instance = orchestrator.getWorkflowInstance(instanceId);
console.log('工作流实例:', instance);

// 3. 查看同步历史
const history = orchestrator.getSyncHistory({ success: false });
console.log('失败的同步:', history);
```

### 问题 2: 模板创建失败

**症状**: createFromTemplate 抛出错误

**原因**:
- 模板不存在
- 模板验证失败
- 工作流 ID 无效

**解决方案**:
```javascript
// 1. 检查模板是否存在
const template = orchestrator.templateManager.getTemplate('template-id');
if (!template) {
  console.error('模板不存在');
}

// 2. 查看所有模板
const allTemplates = orchestrator.templateManager.getAllTemplates();
console.log('可用模板:', allTemplates.map(t => t.id));

// 3. 验证模板结构
try {
  orchestrator.registerTemplate(myTemplate);
} catch (error) {
  console.error('模板验证失败:', error.message);
}
```

### 问题 3: 性能问题

**症状**: 操作响应缓慢

**原因**:
- 过多的同步链接
- 历史记录过多
- 映射规则过多

**解决方案**:
```javascript
// 1. 检查性能指标
const metrics = orchestrator.getPerformanceMetrics();
console.log('性能指标:', metrics);

// 2. 清理资源
orchestrator.destroy();

// 3. 优化映射规则
// 删除不必要的规则
orchestrator.phaseMapper.deleteRule('unused-rule-id');
```

### 问题 4: 自动同步不工作

**症状**: Axiom 变化后，OMC 没有自动同步

**原因**:
- 自动同步未启用
- 同步关系未建立
- 映射规则缺失

**解决方案**:
```javascript
// 1. 检查自动同步状态
const stats = orchestrator.getStats();
console.log('自动同步运行中:', stats.autoSyncEngine.isRunning);

// 2. 检查同步链接
const linkedWorkflows = orchestrator.autoSyncEngine.getLinkedWorkflows(axiomInstanceId);
console.log('关联的工作流:', linkedWorkflows);

// 3. 检查映射规则
const mappedPhases = orchestrator.mapPhase('axiom:draft');
console.log('映射结果:', mappedPhases);
```

## 更多资源

- [API 文档](README.md#api-文档)
- [示例代码](examples/)
- [GitHub Issues](https://github.com/liangjie559567/axiom-omc-integration/issues)
- [贡献指南](CONTRIBUTING.md)

---

**需要帮助？** 请在 [GitHub Issues](https://github.com/liangjie559567/axiom-omc-integration/issues) 提问。
