# 工作流整合增强设计方案

**版本**: 1.0
**日期**: 2026-02-17
**状态**: 设计阶段
**作者**: Axiom-OMC Integration Team

## 执行摘要

本设计方案旨在增强 Axiom-OMC Integration 项目的工作流整合能力，解决三个核心问题：

1. **阶段映射不够灵活** - 当前的硬编码映射无法处理复杂场景
2. **工作流协调不够智能** - 缺少自动化的双向同步机制
3. **缺少工作流模板** - 没有预定义的常见工作流模板

我们采用**混合式架构**方案，在保持向后兼容的前提下，引入三个核心引擎和一个协调器：

- **PhaseMapper**: 智能映射引擎
- **AutoSyncEngine**: 自动同步引擎
- **TemplateManager**: 模板管理器
- **WorkflowOrchestrator**: 工作流协调器

## 目录

1. [背景和动机](#背景和动机)
2. [设计目标](#设计目标)
3. [方案对比](#方案对比)
4. [架构设计](#架构设计)
5. [核心组件](#核心组件)
6. [API 设计](#api-设计)
7. [实现计划](#实现计划)
8. [测试策略](#测试策略)
9. [迁移指南](#迁移指南)
10. [性能考虑](#性能考虑)

---

## 背景和动机

### 当前问题

#### 问题 1: 阶段映射不够灵活

**现状**:
```javascript
// 简单的硬编码映射
mapAxiomToOMC(axiomPhase) {
  const mapping = {
    [AxiomPhase.DRAFT]: OMCPhase.PLANNING,
    [AxiomPhase.REVIEW]: OMCPhase.DESIGN,
    [AxiomPhase.IMPLEMENT]: OMCPhase.IMPLEMENTATION
  };
  return mapping[axiomPhase] || OMCPhase.PLANNING;
}
```

**问题**:
- 一对一映射，无法处理一对多或多对多场景
- 无法根据上下文动态调整映射
- 映射逻辑硬编码，难以扩展
- 不支持条件映射

**影响**:
- 复杂项目的工作流映射不准确
- 无法适应不同团队的工作流习惯
- 映射规则变更需要修改代码

#### 问题 2: 工作流协调不够智能

**现状**:
```javascript
// 手动同步
const axiomId = workflow.startWorkflow('axiom-default');
const omcId = workflow.startWorkflow('omc-default');
await workflow.transitionToNext(axiomId);
// 需要手动映射和同步
const mappedPhase = workflow.mapAxiomToOMC(axiomInstance.currentPhase);
await workflow.transitionTo(omcId, mappedPhase);
```

**问题**:
- 需要手动调用同步逻辑
- 两个系统的状态独立管理
- 没有冲突解决机制
- 同步历史无法追踪

**影响**:
- 使用复杂，容易出错
- 状态不一致的风险
- 难以调试同步问题

#### 问题 3: 缺少工作流模板

**现状**:
```javascript
// 只有两个默认工作流
this.registerWorkflow({
  id: 'axiom-default',
  name: 'Axiom Default Workflow',
  phases: [AxiomPhase.DRAFT, AxiomPhase.REVIEW, AxiomPhase.IMPLEMENT]
});

this.registerWorkflow({
  id: 'omc-default',
  name: 'OMC Team Pipeline',
  phases: [OMCPhase.PLANNING, OMCPhase.DESIGN, OMCPhase.IMPLEMENTATION,
           OMCPhase.TESTING, OMCPhase.DEPLOYMENT]
});
```

**问题**:
- 没有针对特定场景的模板（TDD、调试、代码审查等）
- 每次都需要手动配置工作流
- 无法复用成功的工作流模式

**影响**:
- 降低开发效率
- 团队无法共享最佳实践
- 新手学习成本高

---

## 设计目标

### 功能目标

1. **智能映射**
   - 支持一对多、多对多映射
   - 支持条件映射（基于上下文）
   - 支持自定义映射函数
   - 支持映射规则的动态注册

2. **自动同步**
   - 双向自动同步
   - 多种同步策略（主从、双向、智能）
   - 冲突自动解决
   - 完整的同步历史记录

3. **丰富模板**
   - 5+ 预定义模板（TDD、调试、代码审查、功能开发、重构）
   - 支持模板继承和扩展
   - 支持参数化配置
   - 模板验证机制

### 非功能目标

1. **向后兼容**: 现有代码无需修改即可继续工作
2. **高性能**: 映射和同步操作延迟 < 100ms
3. **可扩展**: 易于添加新的映射规则和模板
4. **易用性**: 提供简洁的高层 API
5. **可测试**: 单元测试覆盖率 > 90%
6. **可维护**: 清晰的代码结构和文档

---

## 方案对比

我们评估了三种可行方案：

### 方案 1: 渐进式增强（保守方案）

**核心思路**: 在现有 WorkflowIntegration 基础上直接扩展

**优点**:
- ✅ 改动最小，风险最低
- ✅ 完全向后兼容
- ✅ 实施速度快

**缺点**:
- ❌ WorkflowIntegration 类会变得臃肿
- ❌ 职责不够清晰
- ❌ 未来扩展受限

**评分**: 6/10

---

### 方案 2: 重构式改进（激进方案）

**核心思路**: 完全重新设计工作流系统

**优点**:
- ✅ 架构最优雅，设计最清晰
- ✅ 扩展性最强
- ✅ 技术债务最少

**缺点**:
- ❌ 改动巨大，风险高
- ❌ 可能破坏现有功能
- ❌ 需要大量测试和迁移工作

**评分**: 7/10

---

### 方案 3: 混合式架构（推荐方案）⭐

**核心思路**: 保留现有系统，新增高层协调器

**优点**:
- ✅ 架构清晰，职责分明
- ✅ 保持向后兼容
- ✅ 支持渐进式迁移
- ✅ 扩展性强
- ✅ 风险可控

**缺点**:
- ⚠️ 初期会有一定复杂度
- ⚠️ 需要维护新旧两套 API（过渡期）

**评分**: 9/10

**选择理由**:
1. 平衡了稳定性和创新性
2. 不破坏现有功能，可以逐步验证
3. 清晰的分层和职责划分
4. 每个组件独立，便于测试
5. 为后续扩展预留空间

---

## 架构设计

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    应用层 (Application Layer)                │
│                                                               │
│  使用者通过统一的 API 与系统交互                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              WorkflowOrchestrator (协调层)                   │
│                                                               │
│  • 统一的高层 API                                             │
│  • 协调三个核心引擎                                           │
│  • 提供便捷方法（如：startTDDWorkflow()）                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ PhaseMapper  │    │ AutoSync     │    │ Template     │
│              │    │ Engine       │    │ Manager      │
│ 智能映射引擎  │    │              │    │              │
│              │    │ 自动同步引擎  │    │ 模板管理器    │
│ • 规则引擎   │    │              │    │              │
│ • 上下文感知 │    │ • 双向监听   │    │ • 预定义模板 │
│ • 多对多映射 │    │ • 同步策略   │    │ • 模板继承   │
│ • 自定义函数 │    │ • 冲突解决   │    │ • 参数化     │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   WorkflowIntegration (基础层)        │
        │                                       │
        │   • 工作流定义和注册                   │
        │   • 工作流实例管理                     │
        │   • 阶段转换                          │
        │   • 事件发射                          │
        └───────────────────────────────────────┘
```

### 核心设计原则

1. **单一职责原则 (SRP)**: 每个组件只负责一个明确的功能
2. **开闭原则 (OCP)**: 对扩展开放，对修改封闭
3. **依赖倒置原则 (DIP)**: 高层模块不依赖低层模块，都依赖抽象
4. **事件驱动架构**: 通过事件实现松耦合
5. **向后兼容**: 保留现有 API，新增高层 API

### 数据流

```
用户请求
    ↓
WorkflowOrchestrator (协调)
    ↓
PhaseMapper (映射) + AutoSyncEngine (同步) + TemplateManager (模板)
    ↓
WorkflowIntegration (执行)
    ↓
事件发射 (通知)
    ↓
AutoSyncEngine (监听并同步)
```

### 模块依赖关系

```
WorkflowOrchestrator
    ├── depends on → PhaseMapper
    ├── depends on → AutoSyncEngine
    ├── depends on → TemplateManager
    └── depends on → WorkflowIntegration

AutoSyncEngine
    ├── depends on → WorkflowIntegration
    └── depends on → PhaseMapper

TemplateManager
    └── depends on → WorkflowIntegration (间接)

PhaseMapper
    └── (无外部依赖)
```

---

## 核心组件

### 1. PhaseMapper（智能映射引擎）

#### 职责

处理 Axiom 和 OMC 之间的阶段映射，支持灵活的映射规则。

#### 核心功能

```javascript
class PhaseMapper {
  constructor() {
    this.mappingRules = new Map();  // 映射规则存储
    this.customMappers = new Map(); // 自定义映射函数
    this.stats = {
      totalRules: 0,
      totalMappings: 0,
      cacheHits: 0
    };
  }

  /**
   * 注册映射规则
   * @param {Object} rule - 映射规则
   * @returns {string} - 规则 ID
   */
  registerRule(rule) {
    // 验证规则
    this._validateRule(rule);

    // 存储规则
    const id = rule.id || generateId();
    this.mappingRules.set(id, {
      ...rule,
      id,
      createdAt: Date.now()
    });

    this.stats.totalRules++;
    return id;
  }

  /**
   * 执行映射
   * @param {string} fromPhase - 源阶段
   * @param {Object} context - 上下文
   * @returns {Array<string>} - 目标阶段列表
   */
  map(fromPhase, context = {}) {
    // 1. 查找匹配的规则
    const matchingRules = this._findMatchingRules(fromPhase, context);

    // 2. 评估条件
    const validRules = matchingRules.filter(rule => {
      if (!rule.condition) return true;
      return rule.condition(context);
    });

    // 3. 按权重排序
    validRules.sort((a, b) => (b.weight || 0) - (a.weight || 0));

    // 4. 提取目标阶段
    const targetPhases = [];
    for (const rule of validRules) {
      targetPhases.push(...rule.to);
    }

    // 5. 去重
    const uniquePhases = [...new Set(targetPhases)];

    this.stats.totalMappings++;
    return uniquePhases;
  }

  /**
   * 反向映射
   * @param {string} toPhase - 目标阶段
   * @param {Object} context - 上下文
   * @returns {Array<string>} - 源阶段列表
   */
  reverseMap(toPhase, context = {}) {
    // 查找反向规则
    const reverseRules = Array.from(this.mappingRules.values())
      .filter(rule => rule.to.includes(toPhase));

    // 评估条件
    const validRules = reverseRules.filter(rule => {
      if (!rule.condition) return true;
      return rule.condition(context);
    });

    // 提取源阶段
    return validRules.map(rule => rule.from);
  }

  /**
   * 注册自定义映射函数
   * @param {string} name - 映射器名称
   * @param {Function} mapperFn - 映射函数
   */
  registerCustomMapper(name, mapperFn) {
    this.customMappers.set(name, mapperFn);
  }

  /**
   * 使用自定义映射器
   * @param {string} name - 映射器名称
   * @param {string} fromPhase - 源阶段
   * @param {Object} context - 上下文
   * @returns {Array<string>} - 目标阶段列表
   */
  mapWithCustomMapper(name, fromPhase, context = {}) {
    const mapper = this.customMappers.get(name);
    if (!mapper) {
      throw new Error(`自定义映射器不存在: ${name}`);
    }
    return mapper(fromPhase, context);
  }

  /**
   * 获取统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    return { ...this.stats };
  }

  // 私有方法
  _validateRule(rule) {
    if (!rule.from || !rule.to) {
      throw new Error('映射规则必须包含 from 和 to 字段');
    }
    if (!Array.isArray(rule.to)) {
      throw new Error('to 字段必须是数组');
    }
  }

  _findMatchingRules(fromPhase, context) {
    return Array.from(this.mappingRules.values())
      .filter(rule => rule.from === fromPhase);
  }
}
```

#### 映射规则示例

```javascript
// 简单映射
{
  id: 'axiom-draft-to-omc-planning',
  from: 'axiom:draft',
  to: ['omc:planning'],
  weight: 1.0
}

// 条件映射
{
  id: 'complex-draft-mapping',
  from: 'axiom:draft',
  to: ['omc:planning', 'omc:design'],
  condition: (context) => {
    return context.complexity === 'high' && context.hasDesignDoc;
  },
  weight: 0.9
}

// 多对多映射
{
  id: 'omc-testing-to-axiom',
  from: 'omc:testing',
  to: ['axiom:review', 'axiom:implement'],
  condition: (context) => context.testsPassed,
  weight: 0.85,
  bidirectional: true
}
```

