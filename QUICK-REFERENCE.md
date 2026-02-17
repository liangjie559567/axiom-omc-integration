# ⚡ 快速参考指南 - Axiom-OMC Integration

**版本**: v1.0.0 MVP
**更新日期**: 2026-02-17

---

## 🚀 5 分钟快速开始

### 1. 安装
```bash
npm install axiom-omc-integration
```

### 2. 基础使用
```javascript
import { WorkflowOrchestrator, WorkflowIntegration } from 'axiom-omc-integration';

const workflowIntegration = new WorkflowIntegration();
const orchestrator = new WorkflowOrchestrator(workflowIntegration);

// 创建同步的工作流对
const { axiomInstanceId, omcInstanceId } =
  await orchestrator.createSyncedWorkflowPair('axiom-default', 'omc-default');

// 启动 TDD 工作流
const tddInstance = await orchestrator.startTDDWorkflow({
  feature: 'user-login'
});
```

### 3. 运行演示
```bash
node demo.js
```

---

## 📖 常用 API

### WorkflowOrchestrator

#### 启动工作流
```javascript
const instance = await orchestrator.startWorkflow('axiom-default', {
  title: '用户认证功能'
});
```

#### 创建同步对
```javascript
const { axiomInstanceId, omcInstanceId } =
  await orchestrator.createSyncedWorkflowPair('axiom-default', 'omc-default');
```

#### 启动 TDD 工作流
```javascript
const tddInstance = await orchestrator.startTDDWorkflow({
  feature: 'shopping-cart',
  testFramework: 'jest'
});
```

#### 阶段转换
```javascript
// 转换到下一个阶段
await orchestrator.transitionToNext(instanceId);

// 转换到指定阶段
await orchestrator.transitionTo(instanceId, 'review');

// 完成工作流
await orchestrator.completeWorkflow(instanceId);
```

#### 映射规则
```javascript
// 注册映射规则
orchestrator.registerMappingRule({
  from: 'draft',
  to: ['planning'],
  weight: 1.0
});

// 执行映射
const targetPhases = orchestrator.mapPhase('draft');

// 反向映射
const sourcePhases = orchestrator.reverseMapPhase('planning');
```

#### 同步操作
```javascript
// 手动同步
await orchestrator.syncWorkflows(sourceId, targetId);

// 查看同步历史
const history = orchestrator.getSyncHistory();
```

#### 模板操作
```javascript
// 注册模板
orchestrator.registerTemplate(myTemplate);

// 从模板创建
const instance = await orchestrator.createFromTemplate('tdd-workflow');
```

#### 统计信息
```javascript
// 获取统计
const stats = orchestrator.getStats();

// 获取性能指标
const metrics = orchestrator.getPerformanceMetrics();
```

---

## 🎯 常见场景

### 场景 1: TDD 开发
```javascript
// 1. 启动 TDD 工作流
const tdd = await orchestrator.startTDDWorkflow({
  feature: 'email-validation'
});

// 2. RED 阶段 - 编写失败的测试
console.log('当前阶段:', tdd.currentPhase); // 'red'

// 3. GREEN 阶段 - 让测试通过
await orchestrator.transitionToNext(tdd.id);

// 4. REFACTOR 阶段 - 重构代码
await orchestrator.transitionToNext(tdd.id);
```

### 场景 2: Axiom-OMC 同步
```javascript
// 1. 注册映射规则
orchestrator.registerMappingRule({
  from: 'draft',
  to: ['planning']
});

// 2. 创建同步对
const { axiomInstanceId, omcInstanceId } =
  await orchestrator.createSyncedWorkflowPair('axiom-default', 'omc-default');

// 3. Axiom 变化时，OMC 自动同步
await orchestrator.transitionTo(axiomInstanceId, 'review');
// OMC 自动同步到 'design'
```

### 场景 3: 自定义模板
```javascript
// 1. 定义模板
const myTemplate = {
  id: 'debug-workflow',
  name: '调试工作流',
  workflowId: 'debug-default',
  phases: [
    { id: 'reproduce', name: '重现问题' },
    { id: 'isolate', name: '隔离问题' },
    { id: 'fix', name: '修复问题' },
    { id: 'verify', name: '验证修复' }
  ]
};

// 2. 注册模板
orchestrator.registerTemplate(myTemplate);

// 3. 使用模板
const instance = await orchestrator.createFromTemplate('debug-workflow');
```

---

## 🔧 配置选项

### WorkflowOrchestrator 选项
```javascript
const orchestrator = new WorkflowOrchestrator(workflowIntegration, {
  enableAutoSync: true,              // 启用自动同步
  defaultSyncStrategy: 'master-slave' // 默认同步策略
});
```

### 映射规则选项
```javascript
orchestrator.registerMappingRule({
  id: 'rule-1',                    // 规则 ID（可选）
  from: 'draft',                   // 源阶段
  to: ['planning', 'design'],      // 目标阶段列表
  weight: 1.0,                     // 权重（可选）
  condition: (context) => true     // 条件函数（可选）
});
```

### 同步选项
```javascript
await orchestrator.createSyncedWorkflowPair('axiom', 'omc', {
  context: {                       // 上下文
    feature: 'payment'
  },
  syncStrategy: 'master-slave'     // 同步策略
});
```

---

## 📊 数据结构

### 工作流实例
```javascript
{
  id: 'instance-1',
  workflowId: 'axiom-default',
  workflowType: 'axiom',
  currentPhase: 'draft',
  phaseIndex: 0,
  phaseStatuses: {
    draft: 'in_progress',
    review: 'pending',
    implement: 'pending'
  },
  context: {
    title: '用户认证功能'
  },
  startedAt: 1708156800000,
  updatedAt: 1708156800000,
  completedAt: null
}
```

### 映射规则
```javascript
{
  id: 'rule-1',
  from: 'draft',
  to: ['planning'],
  weight: 1.0,
  condition: (context) => true
}
```

### 同步历史
```javascript
{
  sourceInstanceId: 'axiom-1',
  targetInstanceId: 'omc-1',
  sourcePhase: 'draft',
  targetPhase: 'planning',
  success: true,
  timestamp: 1708156800000,
  error: null
}
```

### 模板
```javascript
{
  id: 'tdd-workflow',
  name: 'TDD 工作流',
  description: '测试驱动开发工作流',
  workflowId: 'tdd-default',
  phases: [
    {
      id: 'red',
      name: 'RED - 编写失败的测试',
      description: '编写一个失败的测试用例',
      nextPhase: 'green'
    }
  ],
  defaultContext: {
    methodology: 'TDD'
  }
}
```

---

## 🐛 故障排除

### 问题 1: 同步失败
```javascript
// 检查映射规则
const rules = orchestrator.phaseMapper.getAllRules();
console.log('映射规则:', rules);

// 查看同步历史
const history = orchestrator.getSyncHistory({ success: false });
console.log('失败的同步:', history);
```

### 问题 2: 模板创建失败
```javascript
// 检查模板是否存在
const template = orchestrator.templateManager.getTemplate('template-id');
if (!template) {
  console.error('模板不存在');
}

// 查看所有模板
const allTemplates = orchestrator.templateManager.getAllTemplates();
console.log('可用模板:', allTemplates.map(t => t.id));
```

### 问题 3: 性能问题
```javascript
// 检查性能指标
const metrics = orchestrator.getPerformanceMetrics();
console.log('性能指标:', metrics);

// 清理资源
orchestrator.destroy();
```

---

## 📚 更多资源

### 文档
- [README.md](README.md) - 项目概览
- [USAGE-GUIDE.md](USAGE-GUIDE.md) - 详细使用指南
- [MVP-DEMO.md](MVP-DEMO.md) - 功能演示
- [RELEASE-NOTES.md](RELEASE-NOTES.md) - 发布说明

### 示例
- [examples/](examples/) - 示例代码
- [demo.js](demo.js) - 完整演示

### 支持
- [GitHub Issues](https://github.com/liangjie559567/axiom-omc-integration/issues)
- [Email](mailto:axiom-omc-team@example.com)

---

## 🎯 最佳实践

### 1. 映射规则设计
- 使用清晰的命名约定
- 为复杂映射添加条件函数
- 使用权重控制优先级
- 定期审查和更新规则

### 2. 同步策略
- 使用主从模式进行单向同步
- 定期检查同步历史
- 监控同步成功率
- 处理同步失败情况

### 3. 模板使用
- 为常见工作流创建模板
- 使用默认上下文简化使用
- 提供清晰的阶段描述
- 包含使用指南和示例

### 4. 性能优化
- 定期清理历史记录
- 监控性能指标
- 使用批量操作
- 优化映射规则

---

## ⚡ 快捷命令

```bash
# 安装
npm install axiom-omc-integration

# 运行测试
npm test

# 运行演示
node demo.js

# 发布（Windows）
publish.bat

# 发布（Linux/Mac）
./publish.sh
```

---

**需要帮助？** 查看 [USAGE-GUIDE.md](USAGE-GUIDE.md) 或在 [GitHub Issues](https://github.com/liangjie559567/axiom-omc-integration/issues) 提问。
