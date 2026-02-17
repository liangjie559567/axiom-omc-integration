# Axiom-OMC Integration

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/liangjie559567/axiom-omc-integration/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-96.50%25-brightgreen)](https://github.com/liangjie559567/axiom-omc-integration)
[![Tests](https://img.shields.io/badge/tests-620%20passed-brightgreen)](https://github.com/liangjie559567/axiom-omc-integration)
[![Status](https://img.shields.io/badge/status-production%20ready-success)](https://github.com/liangjie559567/axiom-omc-integration)

> 统一的智能开发工作流平台 - 集成 Axiom、OMC 和 Superpowers，提供 32 个专业 Agent、CLI 系统和 Claude Code 插件支持

## 🌟 特性

- **智能映射引擎** - 自动映射不同工作流系统的阶段
- **自动同步引擎** - 实时同步多个工作流状态
- **模板管理器** - 预定义工作流模板（TDD、调试等）
- **统一协调器** - 简洁的 API 管理所有组件
- **高测试覆盖率** - 平均 96.50% 的测试覆盖率
- **生产就绪** - 129 个测试全部通过

## 📦 安装

```bash
npm install axiom-omc-integration
```

## 🚀 快速开始

### 基础使用

```javascript
import { WorkflowOrchestrator } from 'axiom-omc-integration';
import { WorkflowIntegration } from 'axiom-omc-integration';

// 创建工作流集成
const workflowIntegration = new WorkflowIntegration();

// 创建协调器
const orchestrator = new WorkflowOrchestrator(workflowIntegration);

// 启动工作流
const instance = await orchestrator.startWorkflow('my-workflow', {
  title: '用户认证功能'
});

console.log('工作流已启动:', instance.instanceId);
```

### 创建同步的工作流对

```javascript
// 创建 Axiom 和 OMC 的同步工作流对
const { axiomInstanceId, omcInstanceId } =
  await orchestrator.createSyncedWorkflowPair('axiom-default', 'omc-default', {
    context: {
      feature: 'payment-processing'
    }
  });

// Axiom 变化时，OMC 自动同步
await orchestrator.transitionTo(axiomInstanceId, 'axiom:review');
// OMC 自动同步到 omc:design
```

### 使用 TDD 模板

```javascript
// 快速启动 TDD 工作流
const tddInstance = await orchestrator.startTDDWorkflow({
  feature: 'email-validation',
  testFramework: 'jest',
  language: 'javascript'
});

// TDD 循环: RED -> GREEN -> REFACTOR
console.log('当前阶段:', tddInstance.currentPhase); // 'red'
```

## 📚 核心组件

### 1. PhaseMapper（智能映射引擎）

自动映射不同工作流系统的阶段。

```javascript
import { PhaseMapper } from 'axiom-omc-integration';

const mapper = new PhaseMapper();

// 注册映射规则
mapper.registerRule({
  from: 'axiom:draft',
  to: ['omc:planning'],
  weight: 1.0
});

// 执行映射
const result = mapper.map('axiom:draft');
console.log(result); // ['omc:planning']
```

**特性**:
- ✅ 一对一、一对多映射
- ✅ 条件映射
- ✅ 权重排序
- ✅ 反向映射
- ✅ 自定义映射函数

**测试覆盖率**: 93.81%

### 2. AutoSyncEngine（自动同步引擎）

实时同步多个工作流的状态。

```javascript
import { AutoSyncEngine } from 'axiom-omc-integration';

const syncEngine = new AutoSyncEngine(workflowIntegration, phaseMapper);

// 建立同步关系
await syncEngine.linkWorkflows('axiom-1', 'omc-1', {
  strategy: 'master-slave'
});

// 启动自动同步
syncEngine.start();

// 手动同步
await syncEngine.sync('axiom-1', 'omc-1');
```

**特性**:
- ✅ 主从同步模式
- ✅ 事件监听机制
- ✅ 循环检测
- ✅ 同步历史记录
- ✅ 自动同步触发

**测试覆盖率**: 96.15%

### 3. TemplateManager（模板管理器）

管理和使用工作流模板。

```javascript
import { TemplateManager } from 'axiom-omc-integration';
import { tddWorkflowTemplate } from 'axiom-omc-integration/templates';

const templateManager = new TemplateManager(workflowIntegration);

// 注册模板
templateManager.registerTemplate(tddWorkflowTemplate);

// 从模板创建工作流
const instance = await templateManager.createFromTemplate('tdd-workflow', {
  context: {
    feature: 'user-login'
  }
});
```

**特性**:
- ✅ 模板注册和验证
- ✅ 从模板创建工作流
- ✅ 默认上下文支持
- ✅ 上下文覆盖
- ✅ 预定义模板（TDD）

**测试覆盖率**: 98.11%

### 4. WorkflowOrchestrator（工作流协调器）

统一管理所有组件的协调器。

```javascript
import { WorkflowOrchestrator } from 'axiom-omc-integration';

const orchestrator = new WorkflowOrchestrator(workflowIntegration, {
  enableAutoSync: true,
  defaultSyncStrategy: 'master-slave'
});

// 统一的 API
await orchestrator.startWorkflow('my-workflow');
await orchestrator.createSyncedWorkflowPair('axiom', 'omc');
await orchestrator.startTDDWorkflow({ feature: 'login' });

// 统计信息
const stats = orchestrator.getStats();
const metrics = orchestrator.getPerformanceMetrics();
```

**特性**:
- ✅ 集成三个核心引擎
- ✅ 统一的 API
- ✅ 便捷方法
- ✅ 统计和性能指标
- ✅ 自动同步默认启用

**测试覆盖率**: 97.91%

## 🎯 TDD 工作流模板

预定义的 TDD（测试驱动开发）工作流模板。

### 阶段循环

```
RED (编写失败的测试)
  ↓
GREEN (让测试通过)
  ↓
REFACTOR (重构代码)
  ↓
RED (下一个功能) ...
```

### 使用示例

```javascript
// 启动 TDD 工作流
const tddInstance = await orchestrator.startTDDWorkflow({
  feature: 'shopping-cart',
  testFramework: 'jest',
  language: 'javascript'
});

// 阶段 1: RED - 编写失败的测试
console.log('当前阶段:', tddInstance.currentPhase); // 'red'
// 编写测试用例...

// 阶段 2: GREEN - 让测试通过
await orchestrator.transitionToNext(tddInstance.instanceId);
// 实现最小代码...

// 阶段 3: REFACTOR - 重构代码
await orchestrator.transitionToNext(tddInstance.instanceId);
// 优化代码...
```

### 最佳实践

**RED 阶段**:
- 测试应该清晰表达需求
- 测试应该是可重复的
- 一次只测试一个功能点
- 测试失败的原因应该明确

**GREEN 阶段**:
- 使用最简单的实现
- 不要过度设计
- 只关注让测试通过
- 可以使用硬编码或简单逻辑

**REFACTOR 阶段**:
- 保持测试通过
- 消除重复代码
- 提高代码可读性
- 遵循 SOLID 原则
- 频繁运行测试

## 📖 API 文档

### WorkflowOrchestrator

#### 构造函数

```javascript
new WorkflowOrchestrator(workflowIntegration, options)
```

**参数**:
- `workflowIntegration` (Object) - 工作流集成实例
- `options` (Object) - 选项
  - `enableAutoSync` (Boolean) - 是否启用自动同步（默认 true）
  - `defaultSyncStrategy` (String) - 默认同步策略（默认 'master-slave'）

#### 工作流基础 API

##### startWorkflow(workflowId, context)

启动工作流。

**参数**:
- `workflowId` (String) - 工作流 ID
- `context` (Object) - 上下文

**返回**: Promise<Object> - 工作流实例

##### transitionToNext(instanceId)

转换到下一个阶段。

**参数**:
- `instanceId` (String) - 实例 ID

**返回**: Promise<Boolean> - 是否成功

##### transitionTo(instanceId, targetPhase, options)

转换到指定阶段。

**参数**:
- `instanceId` (String) - 实例 ID
- `targetPhase` (String) - 目标阶段
- `options` (Object) - 选项

**返回**: Promise<Boolean> - 是否成功

##### completeWorkflow(instanceId)

完成工作流。

**参数**:
- `instanceId` (String) - 实例 ID

**返回**: Promise<Boolean> - 是否成功

##### getWorkflowInstance(instanceId)

获取工作流实例。

**参数**:
- `instanceId` (String) - 实例 ID

**返回**: Object|null - 工作流实例

#### 映射 API

##### registerMappingRule(rule)

注册映射规则。

**参数**:
- `rule` (Object) - 映射规则
  - `from` (String) - 源阶段
  - `to` (Array<String>) - 目标阶段列表
  - `weight` (Number) - 权重（可选，默认 1.0）
  - `condition` (Function) - 条件函数（可选）

**返回**: String - 规则 ID

##### mapPhase(fromPhase, context)

执行阶段映射。

**参数**:
- `fromPhase` (String) - 源阶段
- `context` (Object) - 上下文（可选）

**返回**: Array<String> - 目标阶段列表

##### reverseMapPhase(toPhase, context)

反向映射。

**参数**:
- `toPhase` (String) - 目标阶段
- `context` (Object) - 上下文（可选）

**返回**: Array<String> - 源阶段列表

#### 同步 API

##### createSyncedWorkflowPair(axiomWorkflowId, omcWorkflowId, options)

创建同步的工作流对。

**参数**:
- `axiomWorkflowId` (String) - Axiom 工作流 ID
- `omcWorkflowId` (String) - OMC 工作流 ID
- `options` (Object) - 选项
  - `context` (Object) - 上下文
  - `syncStrategy` (String) - 同步策略

**返回**: Promise<Object> - { axiomInstanceId, omcInstanceId }

##### syncWorkflows(sourceInstanceId, targetInstanceId)

手动同步工作流。

**参数**:
- `sourceInstanceId` (String) - 源实例 ID
- `targetInstanceId` (String) - 目标实例 ID

**返回**: Promise<Boolean> - 是否成功

##### getSyncHistory(filters)

获取同步历史。

**参数**:
- `filters` (Object) - 过滤条件
  - `instanceId` (String) - 实例 ID（可选）
  - `success` (Boolean) - 成功状态（可选）
  - `limit` (Number) - 限制数量（可选）

**返回**: Array<Object> - 同步历史

#### 模板 API

##### registerTemplate(template)

注册模板。

**参数**:
- `template` (Object) - 模板对象

**返回**: String - 模板 ID

##### createFromTemplate(templateId, params)

从模板创建工作流。

**参数**:
- `templateId` (String) - 模板 ID
- `params` (Object) - 参数
  - `context` (Object) - 上下文

**返回**: Promise<Object> - 工作流实例

##### startTDDWorkflow(context)

启动 TDD 工作流（便捷方法）。

**参数**:
- `context` (Object) - 上下文

**返回**: Promise<Object> - 工作流实例

#### 统计 API

##### getStats()

获取统计信息。

**返回**: Object - 统计信息

##### getPerformanceMetrics()

获取性能指标。

**返回**: Object - 性能指标

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 查看测试覆盖率
npm run test:coverage
```

### 测试统计

- **总测试用例**: 129 个
- **平均覆盖率**: 96.50%
- **通过率**: 100%

| 组件 | 测试用例 | 覆盖率 |
|------|---------|--------|
| PhaseMapper | 34 | 93.81% |
| AutoSyncEngine | 37 | 96.15% |
| TemplateManager | 33 | 98.11% |
| WorkflowOrchestrator | 25 | 97.91% |

## 📝 示例

查看 `examples/` 目录获取更多示例：

- `phase-mapper-example.js` - PhaseMapper 使用示例
- `auto-sync-engine-example.js` - AutoSyncEngine 使用示例
- `template-manager-example.js` - TemplateManager 使用示例
- `workflow-orchestrator-example.js` - WorkflowOrchestrator 使用示例

## 🛠️ 开发

```bash
# 克隆仓库
git clone https://github.com/liangjie559567/axiom-omc-integration.git

# 安装依赖
npm install

# 运行测试
npm test

# 代码检查
npm run lint

# 代码格式化
npm run format
```

## 📄 许可证

[MIT](LICENSE)

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

## 📮 联系

- **Issues**: [GitHub Issues](https://github.com/liangjie559567/axiom-omc-integration/issues)
- **Email**: axiom-omc-team@example.com

## 🙏 致谢

感谢所有贡献者和支持者！

---

**Made with ❤️ by Axiom-OMC Integration Team**
