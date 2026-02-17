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

### 2. AutoSyncEngine（自动同步引擎）

#### 职责

自动同步 Axiom 和 OMC 的工作流状态，支持多种同步策略和冲突解决。

#### 核心功能

```javascript
class AutoSyncEngine extends EventEmitter {
  constructor(workflowIntegration, phaseMapper) {
    super();
    this.workflowIntegration = workflowIntegration;
    this.phaseMapper = phaseMapper;
    this.syncStrategy = 'intelligent'; // 'master-slave' | 'bidirectional' | 'intelligent'
    this.syncLinks = new Map(); // 工作流同步关系
    this.syncHistory = []; // 同步历史
    this.isRunning = false;
    this.stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      conflictsResolved: 0
    };
  }

  /**
   * 启动自动同步
   */
  start() {
    if (this.isRunning) return;

    // 监听工作流事件
    this.workflowIntegration.on('phaseTransitioned',
      this._handlePhaseChange.bind(this));

    this.isRunning = true;
    logger.info('AutoSyncEngine 已启动');
  }

  /**
   * 停止自动同步
   */
  stop() {
    if (!this.isRunning) return;

    this.workflowIntegration.removeListener('phaseTransitioned',
      this._handlePhaseChange.bind(this));

    this.isRunning = false;
    logger.info('AutoSyncEngine 已停止');
  }

  /**
   * 建立工作流同步关系
   * @param {string} sourceId - 源工作流 ID
   * @param {string} targetId - 目标工作流 ID
   * @param {Object} options - 选项
   */
  async linkWorkflows(sourceId, targetId, options = {}) {
    const link = {
      sourceId,
      targetId,
      strategy: options.strategy || this.syncStrategy,
      mappingRules: options.mappingRules || [],
      bidirectional: options.bidirectional !== false,
      createdAt: Date.now()
    };

    // 存储同步关系
    if (!this.syncLinks.has(sourceId)) {
      this.syncLinks.set(sourceId, []);
    }
    this.syncLinks.get(sourceId).push(link);

    // 如果是双向同步，建立反向关系
    if (link.bidirectional) {
      if (!this.syncLinks.has(targetId)) {
        this.syncLinks.set(targetId, []);
      }
      this.syncLinks.get(targetId).push({
        ...link,
        sourceId: targetId,
        targetId: sourceId
      });
    }

    logger.info(`工作流同步关系已建立: ${sourceId} <-> ${targetId}`);
    this.emit('linkCreated', link);
  }

  /**
   * 设置同步策略
   * @param {string} strategy - 同步策略
   */
  setSyncStrategy(strategy) {
    const validStrategies = ['master-slave', 'bidirectional', 'intelligent'];
    if (!validStrategies.includes(strategy)) {
      throw new Error(`无效的同步策略: ${strategy}`);
    }
    this.syncStrategy = strategy;
    logger.info(`同步策略已设置为: ${strategy}`);
  }

  /**
   * 手动触发同步
   * @param {string} sourceInstanceId - 源实例 ID
   * @param {string} targetInstanceId - 目标实例 ID
   * @returns {Promise<boolean>} - 是否成功
   */
  async sync(sourceInstanceId, targetInstanceId) {
    try {
      // 1. 获取源工作流状态
      const sourceInstance = this.workflowIntegration.getWorkflowInstance(sourceInstanceId);
      if (!sourceInstance) {
        throw new Error(`源工作流实例不存在: ${sourceInstanceId}`);
      }

      // 2. 获取目标工作流状态
      const targetInstance = this.workflowIntegration.getWorkflowInstance(targetInstanceId);
      if (!targetInstance) {
        throw new Error(`目标工作流实例不存在: ${targetInstanceId}`);
      }

      // 3. 通过 PhaseMapper 映射阶段
      const mappedPhases = this.phaseMapper.map(sourceInstance.currentPhase, {
        sourceType: sourceInstance.workflowType,
        targetType: targetInstance.workflowType,
        ...sourceInstance.context
      });

      if (mappedPhases.length === 0) {
        logger.warn(`无法映射阶段: ${sourceInstance.currentPhase}`);
        return false;
      }

      // 4. 选择最佳目标阶段（第一个，因为已按权重排序）
      const targetPhase = mappedPhases[0];

      // 5. 更新目标工作流
      await this.workflowIntegration.transitionTo(targetInstanceId, targetPhase, {
        skipIntermediate: true,
        metadata: {
          syncedFrom: sourceInstanceId,
          syncedAt: Date.now()
        }
      });

      // 6. 记录同步历史
      this._recordSync({
        sourceInstanceId,
        targetInstanceId,
        sourcePhase: sourceInstance.currentPhase,
        targetPhase,
        timestamp: Date.now(),
        success: true
      });

      this.stats.totalSyncs++;
      this.stats.successfulSyncs++;

      logger.info(`同步完成: ${sourceInstance.currentPhase} -> ${targetPhase}`);
      this.emit('syncCompleted', {
        sourceInstanceId,
        targetInstanceId,
        sourcePhase: sourceInstance.currentPhase,
        targetPhase
      });

      return true;
    } catch (error) {
      this.stats.totalSyncs++;
      this.stats.failedSyncs++;

      logger.error(`同步失败: ${error.message}`);
      this.emit('syncFailed', {
        sourceInstanceId,
        targetInstanceId,
        error: error.message
      });

      return false;
    }
  }

  /**
   * 获取关联的工作流
   * @param {string} instanceId - 实例 ID
   * @returns {Array<string>} - 关联的工作流 ID 列表
   */
  getLinkedWorkflows(instanceId) {
    const links = this.syncLinks.get(instanceId) || [];
    return links.map(link => link.targetId);
  }

  /**
   * 获取同步历史
   * @param {Object} filters - 过滤条件
   * @returns {Array<Object>} - 同步历史记录
   */
  getSyncHistory(filters = {}) {
    let history = [...this.syncHistory];

    // 按实例过滤
    if (filters.instanceId) {
      history = history.filter(h =>
        h.sourceInstanceId === filters.instanceId ||
        h.targetInstanceId === filters.instanceId
      );
    }

    // 按成功状态过滤
    if (filters.success !== undefined) {
      history = history.filter(h => h.success === filters.success);
    }

    // 限制数量
    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    return history;
  }

  /**
   * 获取统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    return { ...this.stats };
  }

  // 私有方法

  /**
   * 处理阶段变化事件
   * @private
   */
  async _handlePhaseChange(event) {
    const { instanceId, from, to, instance } = event;

    // 查找需要同步的目标工作流
    const links = this.syncLinks.get(instanceId) || [];

    for (const link of links) {
      // 根据策略决定是否同步
      if (await this._shouldSync(link, instance)) {
        await this.sync(instanceId, link.targetId);
      }
    }
  }

  /**
   * 判断是否应该同步
   * @private
   */
  async _shouldSync(link, instance) {
    const strategy = link.strategy || this.syncStrategy;

    switch (strategy) {
      case 'master-slave':
        // 主从模式：总是同步
        return true;

      case 'bidirectional':
        // 双向模式：检查时间戳，避免循环同步
        const targetInstance = this.workflowIntegration.getWorkflowInstance(link.targetId);
        if (!targetInstance) return false;

        // 如果目标最近被同步过，跳过
        const lastSync = this.syncHistory
          .filter(h => h.targetInstanceId === link.targetId)
          .pop();

        if (lastSync && Date.now() - lastSync.timestamp < 1000) {
          return false; // 1秒内不重复同步
        }
        return true;

      case 'intelligent':
        // 智能模式：根据工作流类型和阶段决定
        return this._intelligentSyncDecision(link, instance);

      default:
        return false;
    }
  }

  /**
   * 智能同步决策
   * @private
   */
  _intelligentSyncDecision(link, instance) {
    // 根据工作流类型决定
    if (instance.workflowType === 'axiom') {
      // Axiom 工作流：在 REVIEW 和 IMPLEMENT 阶段同步
      return ['axiom:review', 'axiom:implement'].includes(instance.currentPhase);
    } else if (instance.workflowType === 'omc') {
      // OMC 工作流：在 IMPLEMENTATION 和 TESTING 阶段同步
      return ['omc:implementation', 'omc:testing'].includes(instance.currentPhase);
    }
    return true;
  }

  /**
   * 记录同步历史
   * @private
   */
  _recordSync(record) {
    this.syncHistory.push(record);

    // 保持历史记录在限制内（最多 1000 条）
    if (this.syncHistory.length > 1000) {
      this.syncHistory.shift();
    }
  }

  /**
   * 冲突解决
   * @private
   */
  async resolveConflict(conflict) {
    // conflict: { source, target, reason }

    // 策略 1: 时间戳优先
    if (conflict.source.updatedAt > conflict.target.updatedAt) {
      return 'source';
    } else if (conflict.target.updatedAt > conflict.source.updatedAt) {
      return 'target';
    }

    // 策略 2: 优先级规则
    const sourcePriority = this._getPriority(conflict.source);
    const targetPriority = this._getPriority(conflict.target);

    if (sourcePriority > targetPriority) {
      return 'source';
    } else if (targetPriority > sourcePriority) {
      return 'target';
    }

    // 默认：保持源
    return 'source';
  }

  _getPriority(instance) {
    // 根据工作流类型和阶段返回优先级
    const priorities = {
      'axiom:implement': 10,
      'axiom:review': 8,
      'axiom:draft': 5,
      'omc:deployment': 10,
      'omc:testing': 8,
      'omc:implementation': 6,
      'omc:design': 4,
      'omc:planning': 2
    };
    return priorities[instance.currentPhase] || 0;
  }
}
```

#### 同步策略说明

**1. 主从模式（Master-Slave）**
```javascript
// Axiom 为主，OMC 自动跟随
orchestrator.setSyncStrategy('master-slave');
```
- 适用场景：Axiom 驱动的工作流
- 行为：Axiom 变化时自动同步到 OMC
- 优点：简单明确，单向控制
- 缺点：OMC 的变化不会反向同步

**2. 双向同步（Bidirectional）**
```javascript
// 两个系统平等，根据时间戳决定
orchestrator.setSyncStrategy('bidirectional');
```
- 适用场景：两个系统都可能主动变化
- 行为：任一系统变化都会同步到另一个
- 优点：灵活，支持双向控制
- 缺点：可能出现冲突，需要解决机制

**3. 智能模式（Intelligent）**
```javascript
// 根据工作流类型和阶段自动决定
orchestrator.setSyncStrategy('intelligent');
```
- 适用场景：复杂的混合工作流
- 行为：根据上下文智能决定同步方向和时机
- 优点：最灵活，适应性强
- 缺点：逻辑复杂，需要仔细配置

---

### 3. TemplateManager（模板管理器）

#### 职责

管理预定义的工作流模板，支持模板继承和参数化。

#### 核心功能

```javascript
class TemplateManager {
  constructor() {
    this.templates = new Map();
    this.stats = {
      totalTemplates: 0,
      templatesUsed: 0
    };
    this._initializeDefaultTemplates();
  }

  /**
   * 注册模板
   * @param {Object} template - 模板定义
   * @returns {string} - 模板 ID
   */
  registerTemplate(template) {
    // 验证模板
    this._validateTemplate(template);

    const id = template.id || generateId();
    this.templates.set(id, {
      ...template,
      id,
      createdAt: Date.now()
    });

    this.stats.totalTemplates++;
    logger.info(`模板已注册: ${id}`, { name: template.name });

    return id;
  }

  /**
   * 从模板创建工作流
   * @param {string} templateId - 模板 ID
   * @param {Object} params - 参数
   * @returns {string} - 工作流实例 ID
   */
  createFromTemplate(templateId, params = {}) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`模板不存在: ${templateId}`);
    }

    // 应用参数
    const workflowDef = this._applyParams(template, params);

    // 注册工作流（如果还未注册）
    const workflowId = `${templateId}-instance`;
    if (!workflowIntegration.workflows.has(workflowId)) {
      workflowIntegration.registerWorkflow(workflowDef);
    }

    // 启动工作流实例
    const instanceId = workflowIntegration.startWorkflow(workflowId, params);

    this.stats.templatesUsed++;
    logger.info(`从模板创建工作流: ${templateId}`, { instanceId });

    return instanceId;
  }

  /**
   * 模板继承
   * @param {string} baseTemplateId - 基础模板 ID
   * @param {Object} overrides - 覆盖配置
   * @returns {string} - 新模板 ID
   */
  extendTemplate(baseTemplateId, overrides) {
    const baseTemplate = this.templates.get(baseTemplateId);
    if (!baseTemplate) {
      throw new Error(`基础模板不存在: ${baseTemplateId}`);
    }

    // 深度合并
    const newTemplate = deepMerge(baseTemplate, overrides);
    newTemplate.id = overrides.id || generateId();
    newTemplate.baseTemplate = baseTemplateId;

    return this.registerTemplate(newTemplate);
  }

  /**
   * 获取所有模板
   * @returns {Array<Object>} - 模板列表
   */
  getAllTemplates() {
    return Array.from(this.templates.values());
  }

  /**
   * 获取模板
   * @param {string} templateId - 模板 ID
   * @returns {Object|null} - 模板定义
   */
  getTemplate(templateId) {
    return this.templates.get(templateId) || null;
  }

  /**
   * 验证模板
   * @param {Object} template - 模板定义
   * @returns {boolean} - 是否有效
   */
  validateTemplate(template) {
    try {
      this._validateTemplate(template);
      return true;
    } catch (error) {
      logger.error(`模板验证失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    return { ...this.stats };
  }

  // 私有方法

  _validateTemplate(template) {
    if (!template.name) {
      throw new Error('模板必须包含 name 字段');
    }
    if (!template.phases || !Array.isArray(template.phases)) {
      throw new Error('模板必须包含 phases 数组');
    }
    if (!template.transitions || typeof template.transitions !== 'object') {
      throw new Error('模板必须包含 transitions 对象');
    }
  }

  _applyParams(template, params) {
    // 深拷贝模板
    const workflowDef = JSON.parse(JSON.stringify(template));

    // 应用参数（简单的字符串替换）
    const applyToValue = (value) => {
      if (typeof value === 'string') {
        return value.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          return params[key] !== undefined ? params[key] : match;
        });
      }
      return value;
    };

    // 递归应用参数
    const applyToObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          applyToObject(obj[key]);
        } else {
          obj[key] = applyToValue(obj[key]);
        }
      }
    };

    applyToObject(workflowDef);
    return workflowDef;
  }

  _initializeDefaultTemplates() {
    // 1. TDD 工作流
    this.registerTemplate({
      id: 'tdd-workflow',
      name: 'TDD 工作流',
      description: '测试驱动开发工作流：RED -> GREEN -> REFACTOR',
      phases: ['RED', 'GREEN', 'REFACTOR'],
      transitions: {
        'RED': ['GREEN'],
        'GREEN': ['REFACTOR'],
        'REFACTOR': ['RED', 'COMPLETE']
      },
      syncStrategy: 'intelligent',
      metadata: {
        category: 'development',
        tags: ['tdd', 'testing', 'agile']
      }
    });

    // 2. 调试工作流
    this.registerTemplate({
      id: 'debug-workflow',
      name: '系统化调试工作流',
      description: '结构化的调试流程：REPRODUCE -> ANALYZE -> FIX -> VERIFY',
      phases: ['REPRODUCE', 'ANALYZE', 'FIX', 'VERIFY'],
      transitions: {
        'REPRODUCE': ['ANALYZE'],
        'ANALYZE': ['FIX', 'REPRODUCE'],
        'FIX': ['VERIFY'],
        'VERIFY': ['COMPLETE', 'ANALYZE']
      },
      syncStrategy: 'master-slave',
      metadata: {
        category: 'debugging',
        tags: ['debug', 'troubleshooting', 'bug-fix']
      }
    });

    // 3. 代码审查工作流
    this.registerTemplate({
      id: 'code-review-workflow',
      name: '代码审查工作流',
      description: '标准的代码审查流程：PREPARE -> REVIEW -> REVISE -> APPROVE',
      phases: ['PREPARE', 'REVIEW', 'REVISE', 'APPROVE'],
      transitions: {
        'PREPARE': ['REVIEW'],
        'REVIEW': ['REVISE', 'APPROVE'],
        'REVISE': ['REVIEW'],
        'APPROVE': ['COMPLETE']
      },
      syncStrategy: 'bidirectional',
      metadata: {
        category: 'quality',
        tags: ['code-review', 'quality-assurance', 'collaboration']
      }
    });

    // 4. 功能开发工作流
    this.registerTemplate({
      id: 'feature-dev-workflow',
      name: '功能开发工作流',
      description: '完整的功能开发流程：BRAINSTORM -> PLAN -> IMPLEMENT -> TEST -> DEPLOY',
      phases: ['BRAINSTORM', 'PLAN', 'IMPLEMENT', 'TEST', 'DEPLOY'],
      transitions: {
        'BRAINSTORM': ['PLAN'],
        'PLAN': ['IMPLEMENT', 'BRAINSTORM'],
        'IMPLEMENT': ['TEST'],
        'TEST': ['DEPLOY', 'IMPLEMENT'],
        'DEPLOY': ['COMPLETE']
      },
      syncStrategy: 'intelligent',
      metadata: {
        category: 'development',
        tags: ['feature', 'development', 'full-cycle']
      }
    });

    // 5. 重构工作流
    this.registerTemplate({
      id: 'refactor-workflow',
      name: '重构工作流',
      description: '安全的重构流程：ANALYZE -> DESIGN -> REFACTOR -> VERIFY',
      phases: ['ANALYZE', 'DESIGN', 'REFACTOR', 'VERIFY'],
      transitions: {
        'ANALYZE': ['DESIGN'],
        'DESIGN': ['REFACTOR', 'ANALYZE'],
        'REFACTOR': ['VERIFY'],
        'VERIFY': ['COMPLETE', 'REFACTOR']
      },
      syncStrategy: 'master-slave',
      metadata: {
        category: 'maintenance',
        tags: ['refactor', 'code-quality', 'technical-debt']
      }
    });

    logger.info('默认模板已初始化', { count: this.templates.size });
  }
}
```

### 4. WorkflowOrchestrator（工作流协调器）

#### 职责

提供统一的高层 API，协调三个核心引擎，简化使用复杂度。

#### 核心功能

```javascript
class WorkflowOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();

    // 基础层
    this.workflowIntegration = new WorkflowIntegration(config);

    // 三个核心引擎
    this.phaseMapper = new PhaseMapper();
    this.autoSyncEngine = new AutoSyncEngine(
      this.workflowIntegration,
      this.phaseMapper
    );
    this.templateManager = new TemplateManager();

    // 配置
    this.config = {
      enableAutoSync: config.enableAutoSync !== false,
      defaultSyncStrategy: config.defaultSyncStrategy || 'intelligent',
      logLevel: config.logLevel || 'info',
      ...config
    };

    this._initialize();
  }

  // ========== 高层 API：模板工作流 ==========

  /**
   * 启动 TDD 工作流
   * @param {Object} context - 上下文
   * @returns {Promise<string>} - 实例 ID
   */
  async startTDDWorkflow(context = {}) {
    return this.templateManager.createFromTemplate('tdd-workflow', {
      ...context,
      syncStrategy: 'intelligent'
    });
  }

  /**
   * 启动调试工作流
   * @param {Object} context - 上下文
   * @returns {Promise<string>} - 实例 ID
   */
  async startDebugWorkflow(context = {}) {
    return this.templateManager.createFromTemplate('debug-workflow', context);
  }

  /**
   * 启动代码审查工作流
   * @param {Object} context - 上下文
   * @returns {Promise<string>} - 实例 ID
   */
  async startCodeReviewWorkflow(context = {}) {
    return this.templateManager.createFromTemplate('code-review-workflow', context);
  }

  /**
   * 启动功能开发工作流
   * @param {Object} context - 上下文
   * @returns {Promise<string>} - 实例 ID
   */
  async startFeatureDevWorkflow(context = {}) {
    return this.templateManager.createFromTemplate('feature-dev-workflow', context);
  }

  /**
   * 启动重构工作流
   * @param {Object} context - 上下文
   * @returns {Promise<string>} - 实例 ID
   */
  async startRefactorWorkflow(context = {}) {
    return this.templateManager.createFromTemplate('refactor-workflow', context);
  }

  // ========== 高层 API：智能同步 ==========

  /**
   * 创建同步的工作流对（Axiom + OMC）
   * @param {string} axiomWorkflowId - Axiom 工作流 ID
   * @param {string} omcWorkflowId - OMC 工作流 ID
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - { axiomInstanceId, omcInstanceId }
   */
  async createSyncedWorkflowPair(axiomWorkflowId, omcWorkflowId, options = {}) {
    // 1. 启动 Axiom 工作流
    const axiomInstanceId = this.workflowIntegration.startWorkflow(
      axiomWorkflowId,
      { ...options.axiomContext, type: 'axiom' }
    );

    // 2. 启动 OMC 工作流
    const omcInstanceId = this.workflowIntegration.startWorkflow(
      omcWorkflowId,
      { ...options.omcContext, type: 'omc' }
    );

    // 3. 建立同步关系
    await this.autoSyncEngine.linkWorkflows(axiomInstanceId, omcInstanceId, {
      strategy: options.syncStrategy || this.config.defaultSyncStrategy,
      mappingRules: options.mappingRules,
      bidirectional: options.bidirectional !== false
    });

    logger.info('同步工作流对已创建', { axiomInstanceId, omcInstanceId });

    return { axiomInstanceId, omcInstanceId };
  }

  /**
   * 启用/禁用自动同步
   * @param {boolean} enabled - 是否启用
   */
  setAutoSync(enabled) {
    if (enabled) {
      this.autoSyncEngine.start();
      logger.info('自动同步已启用');
    } else {
      this.autoSyncEngine.stop();
      logger.info('自动同步已禁用');
    }
  }

  /**
   * 设置同步策略
   * @param {string} strategy - 同步策略
   */
  setSyncStrategy(strategy) {
    this.autoSyncEngine.setSyncStrategy(strategy);
  }

  /**
   * 手动同步工作流
   * @param {string} sourceId - 源实例 ID
   * @param {string} targetId - 目标实例 ID
   * @returns {Promise<boolean>} - 是否成功
   */
  async syncWorkflows(sourceId, targetId) {
    return this.autoSyncEngine.sync(sourceId, targetId);
  }

  // ========== 高层 API：智能映射 ==========

  /**
   * 注册映射规则
   * @param {Object} rule - 映射规则
   * @returns {string} - 规则 ID
   */
  registerMappingRule(rule) {
    return this.phaseMapper.registerRule(rule);
  }

  /**
   * 批量注册映射规则
   * @param {Array<Object>} rules - 映射规则列表
   */
  registerMappingRules(rules) {
    rules.forEach(rule => this.phaseMapper.registerRule(rule));
  }

  /**
   * 执行映射
   * @param {string} fromPhase - 源阶段
   * @param {Object} context - 上下文
   * @returns {Promise<Array<string>>} - 目标阶段列表
   */
  async mapPhase(fromPhase, context = {}) {
    return this.phaseMapper.map(fromPhase, context);
  }

  /**
   * 反向映射
   * @param {string} toPhase - 目标阶段
   * @param {Object} context - 上下文
   * @returns {Promise<Array<string>>} - 源阶段列表
   */
  async reverseMapPhase(toPhase, context = {}) {
    return this.phaseMapper.reverseMap(toPhase, context);
  }

  // ========== 高层 API：模板管理 ==========

  /**
   * 注册自定义模板
   * @param {Object} template - 模板定义
   * @returns {string} - 模板 ID
   */
  registerTemplate(template) {
    return this.templateManager.registerTemplate(template);
  }

  /**
   * 获取所有模板
   * @returns {Array<Object>} - 模板列表
   */
  getTemplates() {
    return this.templateManager.getAllTemplates();
  }

  /**
   * 获取模板
   * @param {string} templateId - 模板 ID
   * @returns {Object|null} - 模板定义
   */
  getTemplate(templateId) {
    return this.templateManager.getTemplate(templateId);
  }

  /**
   * 从模板创建工作流
   * @param {string} templateId - 模板 ID
   * @param {Object} params - 参数
   * @returns {Promise<string>} - 实例 ID
   */
  async createFromTemplate(templateId, params = {}) {
    return this.templateManager.createFromTemplate(templateId, params);
  }

  /**
   * 扩展模板
   * @param {string} baseTemplateId - 基础模板 ID
   * @param {Object} overrides - 覆盖配置
   * @returns {string} - 新模板 ID
   */
  extendTemplate(baseTemplateId, overrides) {
    return this.templateManager.extendTemplate(baseTemplateId, overrides);
  }

  // ========== 基础 API（向后兼容）==========

  /**
   * 启动工作流
   * @param {string} workflowId - 工作流 ID
   * @param {Object} context - 上下文
   * @returns {string} - 实例 ID
   */
  startWorkflow(workflowId, context = {}) {
    return this.workflowIntegration.startWorkflow(workflowId, context);
  }

  /**
   * 注册工作流
   * @param {Object} workflow - 工作流定义
   * @returns {string} - 工作流 ID
   */
  registerWorkflow(workflow) {
    return this.workflowIntegration.registerWorkflow(workflow);
  }

  /**
   * 转换到下一个阶段
   * @param {string} instanceId - 实例 ID
   * @param {Object} options - 选项
   * @returns {Promise<boolean>} - 是否成功
   */
  async transitionToNext(instanceId, options = {}) {
    return this.workflowIntegration.transitionToNext(instanceId, options);
  }

  /**
   * 转换到指定阶段
   * @param {string} instanceId - 实例 ID
   * @param {string} targetPhase - 目标阶段
   * @param {Object} options - 选项
   * @returns {Promise<boolean>} - 是否成功
   */
  async transitionTo(instanceId, targetPhase, options = {}) {
    return this.workflowIntegration.transitionTo(instanceId, targetPhase, options);
  }

  /**
   * 完成工作流
   * @param {string} instanceId - 实例 ID
   * @returns {boolean} - 是否成功
   */
  completeWorkflow(instanceId) {
    return this.workflowIntegration.completeWorkflow(instanceId);
  }

  /**
   * 取消工作流
   * @param {string} instanceId - 实例 ID
   * @returns {boolean} - 是否成功
   */
  cancelWorkflow(instanceId) {
    return this.workflowIntegration.cancelWorkflow(instanceId);
  }

  /**
   * 获取工作流实例
   * @param {string} instanceId - 实例 ID
   * @returns {Object|null} - 实例信息
   */
  getWorkflowInstance(instanceId) {
    return this.workflowIntegration.getWorkflowInstance(instanceId);
  }

  /**
   * 获取所有活动工作流
   * @param {Object} filters - 过滤条件
   * @returns {Array<Object>} - 工作流列表
   */
  getActiveWorkflows(filters = {}) {
    return this.workflowIntegration.getActiveWorkflows(filters);
  }

  // ========== 监控和统计 ==========

  /**
   * 获取统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    return {
      workflows: this.workflowIntegration.getStats(),
      sync: this.autoSyncEngine.getStats(),
      mapping: this.phaseMapper.getStats(),
      templates: this.templateManager.getStats()
    };
  }

  /**
   * 获取同步历史
   * @param {Object} filters - 过滤条件
   * @returns {Array<Object>} - 同步历史记录
   */
  getSyncHistory(filters = {}) {
    return this.autoSyncEngine.getSyncHistory(filters);
  }

  /**
   * 获取转换历史
   * @param {Object} filters - 过滤条件
   * @returns {Array<Object>} - 转换历史记录
   */
  getTransitionHistory(filters = {}) {
    return this.workflowIntegration.getTransitionHistory(filters);
  }

  /**
   * 获取调试信息
   * @returns {Object} - 调试信息
   */
  getDebugInfo() {
    return {
      activeWorkflows: this.getActiveWorkflows(),
      mappingRules: Array.from(this.phaseMapper.mappingRules.values()),
      syncLinks: Array.from(this.autoSyncEngine.syncLinks.entries()),
      templates: this.getTemplates(),
      stats: this.getStats()
    };
  }

  // ========== 私有方法 ==========

  _initialize() {
    // 初始化默认映射规则
    this._initializeDefaultMappingRules();

    // 启动自动同步（如果启用）
    if (this.config.enableAutoSync) {
      this.autoSyncEngine.start();
    }

    // 转发事件
    this._setupEventForwarding();

    logger.info('WorkflowOrchestrator 已初始化', {
      autoSync: this.config.enableAutoSync,
      syncStrategy: this.config.defaultSyncStrategy
    });
  }

  _initializeDefaultMappingRules() {
    // Axiom -> OMC 映射规则
    this.registerMappingRules([
      {
        id: 'axiom-draft-to-omc-planning',
        from: 'axiom:draft',
        to: ['omc:planning'],
        weight: 1.0,
        bidirectional: true
      },
      {
        id: 'axiom-draft-to-omc-design-complex',
        from: 'axiom:draft',
        to: ['omc:planning', 'omc:design'],
        condition: (context) => context.complexity === 'high',
        weight: 0.9,
        bidirectional: false
      },
      {
        id: 'axiom-review-to-omc-design',
        from: 'axiom:review',
        to: ['omc:design'],
        weight: 1.0,
        bidirectional: true
      },
      {
        id: 'axiom-implement-to-omc-implementation',
        from: 'axiom:implement',
        to: ['omc:implementation'],
        weight: 1.0,
        bidirectional: false
      },
      {
        id: 'axiom-implement-to-omc-testing',
        from: 'axiom:implement',
        to: ['omc:testing'],
        condition: (context) => context.hasTests,
        weight: 0.85,
        bidirectional: false
      }
    ]);

    // OMC -> Axiom 映射规则
    this.registerMappingRules([
      {
        id: 'omc-planning-to-axiom-draft',
        from: 'omc:planning',
        to: ['axiom:draft'],
        weight: 1.0
      },
      {
        id: 'omc-design-to-axiom-review',
        from: 'omc:design',
        to: ['axiom:review'],
        weight: 1.0
      },
      {
        id: 'omc-implementation-to-axiom-implement',
        from: 'omc:implementation',
        to: ['axiom:implement'],
        weight: 1.0
      },
      {
        id: 'omc-testing-to-axiom-implement',
        from: 'omc:testing',
        to: ['axiom:implement'],
        weight: 0.9
      },
      {
        id: 'omc-deployment-to-axiom-implement',
        from: 'omc:deployment',
        to: ['axiom:implement'],
        weight: 0.8
      }
    ]);

    logger.info('默认映射规则已初始化', {
      count: this.phaseMapper.mappingRules.size
    });
  }

  _setupEventForwarding() {
    // 转发底层事件到上层
    this.workflowIntegration.on('workflowStarted', (data) => {
      this.emit('workflowStarted', data);
    });

    this.workflowIntegration.on('phaseTransitioned', (data) => {
      this.emit('phaseTransitioned', data);
    });

    this.workflowIntegration.on('workflowCompleted', (data) => {
      this.emit('workflowCompleted', data);
    });

    this.autoSyncEngine.on('syncCompleted', (data) => {
      this.emit('syncCompleted', data);
    });

    this.autoSyncEngine.on('syncFailed', (data) => {
      this.emit('syncFailed', data);
    });
  }

  /**
   * 清理资源
   */
  destroy() {
    this.autoSyncEngine.stop();
    this.workflowIntegration.destroy();
    this.removeAllListeners();
    logger.info('WorkflowOrchestrator 已销毁');
  }
}

/**
 * 创建工作流协调器
 * @param {Object} config - 配置选项
 * @returns {WorkflowOrchestrator} - 协调器实例
 */
export function createWorkflowOrchestrator(config) {
  return new WorkflowOrchestrator(config);
}

export { WorkflowOrchestrator };
```

---

## API 设计

### 使用示例

#### 示例 1：使用 TDD 工作流模板

```javascript
import { WorkflowOrchestrator } from './src/core/WorkflowOrchestrator.js';

const orchestrator = new WorkflowOrchestrator({
  enableAutoSync: true,
  defaultSyncStrategy: 'intelligent'
});

// 启动 TDD 工作流
const tddInstanceId = await orchestrator.startTDDWorkflow({
  feature: 'user-authentication',
  complexity: 'medium'
});

// 监听阶段变化
orchestrator.on('phaseTransitioned', ({ instanceId, from, to }) => {
  console.log(`TDD 工作流: ${from} -> ${to}`);
});

// 转换到下一阶段
await orchestrator.transitionToNext(tddInstanceId);
// RED -> GREEN

await orchestrator.transitionToNext(tddInstanceId);
// GREEN -> REFACTOR

await orchestrator.completeWorkflow(tddInstanceId);
// REFACTOR -> COMPLETE
```

#### 示例 2：创建同步的工作流对

```javascript
const { axiomInstanceId, omcInstanceId } = await orchestrator.createSyncedWorkflowPair(
  'axiom-default',
  'omc-default',
  {
    syncStrategy: 'bidirectional',
    axiomContext: {
      project: 'my-app',
      complexity: 'high'
    },
    omcContext: {
      project: 'my-app',
      hasTests: true
    }
  }
);

// Axiom 工作流变化会自动同步到 OMC
await orchestrator.transitionToNext(axiomInstanceId);
// axiom:draft -> axiom:review
// 自动同步: omc:planning -> omc:design

// 监听同步事件
orchestrator.on('syncCompleted', ({ sourceInstanceId, targetInstanceId, sourcePhase, targetPhase }) => {
  console.log(`同步完成: ${sourcePhase} -> ${targetPhase}`);
});
```

#### 示例 3：自定义映射规则

```javascript
// 注册自定义映射规则
orchestrator.registerMappingRule({
  id: 'custom-complex-mapping',
  from: 'axiom:draft',
  to: ['omc:planning', 'omc:design'],
  condition: (context) => {
    return context.complexity === 'high' && context.requiresDesign;
  },
  weight: 0.95
});

// 使用自定义映射
const mappedPhases = await orchestrator.mapPhase('axiom:draft', {
  complexity: 'high',
  requiresDesign: true
});
console.log('映射结果:', mappedPhases);
// ['omc:planning', 'omc:design']
```

#### 示例 4：注册自定义模板

```javascript
// 注册自定义模板
orchestrator.registerTemplate({
  id: 'custom-workflow',
  name: '自定义工作流',
  description: '我的团队专用工作流',
  phases: ['PHASE_1', 'PHASE_2', 'PHASE_3'],
  transitions: {
    'PHASE_1': ['PHASE_2'],
    'PHASE_2': ['PHASE_3'],
    'PHASE_3': []
  },
  syncStrategy: 'master-slave',
  metadata: {
    author: 'team',
    version: '1.0.0'
  }
});

// 使用自定义模板
const customInstanceId = await orchestrator.createFromTemplate('custom-workflow', {
  projectName: 'my-project'
});
```

#### 示例 5：监控和统计

```javascript
// 获取统计信息
const stats = orchestrator.getStats();
console.log('工作流统计:', stats.workflows);
console.log('同步统计:', stats.sync);
console.log('映射统计:', stats.mapping);
console.log('模板统计:', stats.templates);

// 获取同步历史
const syncHistory = orchestrator.getSyncHistory({
  instanceId: axiomInstanceId,
  limit: 10
});
console.log('最近 10 次同步:', syncHistory);

// 获取调试信息
const debugInfo = orchestrator.getDebugInfo();
console.log('活动工作流:', debugInfo.activeWorkflows);
console.log('映射规则:', debugInfo.mappingRules);
console.log('同步链接:', debugInfo.syncLinks);
```

## 实现计划

### 文件结构

```
src/
├── core/
│   ├── workflow-integration.js          # 现有（保留）
│   ├── workflow-orchestrator.js         # 新增：协调器
│   ├── phase-mapper.js                  # 新增：映射引擎
│   ├── auto-sync-engine.js              # 新增：同步引擎
│   └── template-manager.js              # 新增：模板管理器
├── templates/
│   ├── index.js                         # 新增：模板导出
│   ├── tdd-workflow.js                  # 新增：TDD 模板
│   ├── debug-workflow.js                # 新增：调试模板
│   ├── code-review-workflow.js          # 新增：代码审查模板
│   ├── feature-dev-workflow.js          # 新增：功能开发模板
│   └── refactor-workflow.js             # 新增：重构模板
└── utils/
    └── workflow-helpers.js              # 新增：辅助函数

tests/
├── unit/
│   ├── phase-mapper.test.js             # 新增
│   ├── auto-sync-engine.test.js         # 新增
│   ├── template-manager.test.js         # 新增
│   └── workflow-orchestrator.test.js    # 新增
└── integration/
    └── workflow-orchestration.test.js   # 新增：集成测试

docs/
├── api/
│   ├── workflow-orchestrator.md         # 新增：API 文档
│   ├── phase-mapper.md                  # 新增：映射引擎文档
│   ├── auto-sync-engine.md              # 新增：同步引擎文档
│   └── template-manager.md              # 新增：模板管理器文档
└── guides/
    ├── workflow-templates.md            # 新增：模板使用指南
    ├── custom-mapping.md                # 新增：自定义映射指南
    └── migration-guide.md               # 新增：迁移指南
```

---

### 实施阶段

#### 阶段 1：基础设施（第 1-2 周）

**目标**：实现 PhaseMapper 和映射规则引擎

**任务**：
1. ✅ 创建 `src/core/phase-mapper.js`
2. ✅ 实现基础映射功能
3. ✅ 实现条件映射
4. ✅ 实现权重排序
5. ✅ 实现自定义映射函数
6. ✅ 编写单元测试（覆盖率 > 90%）
7. ✅ 编写 API 文档

**验收标准**：
- 所有单元测试通过
- 支持简单映射、条件映射、多对多映射
- 性能：映射操作 < 10ms

**代码示例**：
```javascript
// tests/unit/phase-mapper.test.js
describe('PhaseMapper', () => {
  test('应该正确映射简单规则', () => {
    const mapper = new PhaseMapper();
    mapper.registerRule({
      from: 'axiom:draft',
      to: ['omc:planning'],
      weight: 1.0
    });

    const result = mapper.map('axiom:draft');
    expect(result).toEqual(['omc:planning']);
  });
});
```

---

#### 阶段 2：自动同步（第 3-4 周）

**目标**：实现 AutoSyncEngine 和三种同步策略

**任务**：
1. ✅ 创建 `src/core/auto-sync-engine.js`
2. ✅ 实现事件监听机制
3. ✅ 实现主从同步策略
4. ✅ 实现双向同步策略
5. ✅ 实现智能同步策略
6. ✅ 实现冲突解决机制
7. ✅ 实现同步历史记录
8. ✅ 编写单元测试（覆盖率 > 90%）
9. ✅ 编写 API 文档

**验收标准**：
- 所有单元测试通过
- 三种同步策略正常工作
- 冲突解决机制有效
- 性能：同步操作 < 100ms

**代码示例**：
```javascript
// tests/unit/auto-sync-engine.test.js
describe('AutoSyncEngine', () => {
  test('应该正确同步阶段变化', async () => {
    const engine = new AutoSyncEngine(workflowIntegration, phaseMapper);
    const axiomId = workflowIntegration.startWorkflow('axiom-default');
    const omcId = workflowIntegration.startWorkflow('omc-default');

    await engine.linkWorkflows(axiomId, omcId);
    await workflowIntegration.transitionToNext(axiomId);

    // 等待同步完成
    await new Promise(resolve => setTimeout(resolve, 100));

    const omcInstance = workflowIntegration.getWorkflowInstance(omcId);
    expect(omcInstance.currentPhase).toBe('omc:design');
  });
});
```

---

#### 阶段 3：模板系统（第 5-6 周）

**目标**：实现 TemplateManager 和 5 个预定义模板

**任务**：
1. ✅ 创建 `src/core/template-manager.js`
2. ✅ 实现模板注册和验证
3. ✅ 实现模板继承
4. ✅ 实现参数化配置
5. ✅ 创建 5 个预定义模板
   - TDD 工作流
   - 调试工作流
   - 代码审查工作流
   - 功能开发工作流
   - 重构工作流
6. ✅ 编写单元测试（覆盖率 > 90%）
7. ✅ 编写模板使用指南

**验收标准**：
- 所有单元测试通过
- 5 个模板可正常使用
- 模板继承功能正常
- 参数化配置有效

**代码示例**：
```javascript
// src/templates/tdd-workflow.js
export const tddWorkflowTemplate = {
  id: 'tdd-workflow',
  name: 'TDD 工作流',
  description: '测试驱动开发工作流',
  phases: ['RED', 'GREEN', 'REFACTOR'],
  transitions: {
    'RED': ['GREEN'],
    'GREEN': ['REFACTOR'],
    'REFACTOR': ['RED', 'COMPLETE']
  },
  syncStrategy: 'intelligent',
  metadata: {
    category: 'development',
    tags: ['tdd', 'testing', 'agile']
  }
};
```

---

#### 阶段 4：协调器（第 7-8 周）

**目标**：实现 WorkflowOrchestrator 和高层 API

**任务**：
1. ✅ 创建 `src/core/workflow-orchestrator.js`
2. ✅ 集成三个核心引擎
3. ✅ 实现高层 API（模板工作流）
4. ✅ 实现高层 API（智能同步）
5. ✅ 实现高层 API（智能映射）
6. ✅ 实现事件转发
7. ✅ 实现统计和监控
8. ✅ 编写集成测试
9. ✅ 编写 API 文档

**验收标准**：
- 所有集成测试通过
- 高层 API 易用性良好
- 向后兼容性保持
- 性能：端到端操作 < 200ms

**代码示例**：
```javascript
// tests/integration/workflow-orchestration.test.js
describe('WorkflowOrchestrator Integration', () => {
  test('应该支持完整的 TDD 工作流', async () => {
    const orchestrator = new WorkflowOrchestrator();

    // 启动 TDD 工作流
    const instanceId = await orchestrator.startTDDWorkflow({
      feature: 'auth'
    });

    // RED -> GREEN
    await orchestrator.transitionToNext(instanceId);

    // GREEN -> REFACTOR
    await orchestrator.transitionToNext(instanceId);

    // 完成
    await orchestrator.completeWorkflow(instanceId);

    const stats = orchestrator.getStats();
    expect(stats.workflows.completedWorkflows).toBe(1);
  });
});
```

---

#### 阶段 5：文档和示例（第 9 周）

**目标**：完善文档和示例代码

**任务**：
1. ✅ 编写 API 文档
   - WorkflowOrchestrator API
   - PhaseMapper API
   - AutoSyncEngine API
   - TemplateManager API
2. ✅ 编写使用指南
   - 工作流模板使用指南
   - 自定义映射指南
   - 同步策略选择指南
3. ✅ 编写迁移指南
4. ✅ 创建示例代码
5. ✅ 更新 README

**验收标准**：
- 所有 API 有完整文档
- 至少 5 个使用示例
- 迁移指南清晰易懂

---

### 里程碑

| 里程碑 | 时间 | 交付物 |
|--------|------|--------|
| M1: 映射引擎完成 | 第 2 周末 | PhaseMapper + 测试 + 文档 |
| M2: 同步引擎完成 | 第 4 周末 | AutoSyncEngine + 测试 + 文档 |
| M3: 模板系统完成 | 第 6 周末 | TemplateManager + 5 个模板 + 测试 |
| M4: 协调器完成 | 第 8 周末 | WorkflowOrchestrator + 集成测试 |
| M5: 文档完成 | 第 9 周末 | 完整文档 + 示例 + 迁移指南 |

---

## 测试策略

### 单元测试

**目标覆盖率**: > 90%

**测试框架**: Jest

**测试文件组织**：
```
tests/unit/
├── phase-mapper.test.js
├── auto-sync-engine.test.js
├── template-manager.test.js
└── workflow-orchestrator.test.js
```

**关键测试场景**：

#### PhaseMapper 测试
```javascript
describe('PhaseMapper', () => {
  describe('registerRule', () => {
    test('应该成功注册简单映射规则');
    test('应该成功注册条件映射规则');
    test('应该拒绝无效的映射规则');
  });

  describe('map', () => {
    test('应该正确映射简单规则');
    test('应该根据条件选择映射');
    test('应该按权重排序结果');
    test('应该处理多对多映射');
    test('应该返回空数组当无匹配规则');
  });

  describe('reverseMap', () => {
    test('应该正确反向映射');
    test('应该处理多个源阶段');
  });

  describe('customMapper', () => {
    test('应该支持自定义映射函数');
    test('应该抛出错误当映射器不存在');
  });
});
```

#### AutoSyncEngine 测试
```javascript
describe('AutoSyncEngine', () => {
  describe('linkWorkflows', () => {
    test('应该成功建立工作流同步关系');
    test('应该支持双向同步关系');
  });

  describe('sync', () => {
    test('应该正确同步阶段变化');
    test('应该记录同步历史');
    test('应该处理同步失败');
  });

  describe('syncStrategy', () => {
    test('主从模式应该单向同步');
    test('双向模式应该双向同步');
    test('智能模式应该根据上下文决定');
  });

  describe('conflictResolution', () => {
    test('应该使用时间戳解决冲突');
    test('应该使用优先级解决冲突');
  });
});
```

#### TemplateManager 测试
```javascript
describe('TemplateManager', () => {
  describe('registerTemplate', () => {
    test('应该成功注册模板');
    test('应该验证模板结构');
    test('应该拒绝无效模板');
  });

  describe('createFromTemplate', () => {
    test('应该从模板创建工作流');
    test('应该应用参数');
    test('应该抛出错误当模板不存在');
  });

  describe('extendTemplate', () => {
    test('应该支持模板继承');
    test('应该正确合并配置');
  });

  describe('validateTemplate', () => {
    test('应该验证必需字段');
    test('应该验证阶段和转换');
  });
});
```

#### WorkflowOrchestrator 测试
```javascript
describe('WorkflowOrchestrator', () => {
  describe('initialization', () => {
    test('应该正确初始化所有组件');
    test('应该加载默认映射规则');
    test('应该根据配置启动自动同步');
  });

  describe('templateWorkflows', () => {
    test('应该启动 TDD 工作流');
    test('应该启动调试工作流');
    test('应该启动代码审查工作流');
  });

  describe('syncedWorkflowPair', () => {
    test('应该创建同步的工作流对');
    test('应该自动同步阶段变化');
  });

  describe('backwardCompatibility', () => {
    test('应该保持现有 API 兼容');
    test('应该支持旧的工作流定义');
  });
});
```

---

### 集成测试

**测试场景**：

```javascript
describe('Workflow Orchestration Integration', () => {
  test('完整的 TDD 工作流', async () => {
    // 启动 -> RED -> GREEN -> REFACTOR -> 完成
  });

  test('Axiom 和 OMC 同步工作流', async () => {
    // 创建同步对 -> Axiom 变化 -> 验证 OMC 同步
  });

  test('自定义映射规则', async () => {
    // 注册规则 -> 创建工作流 -> 验证映射
  });

  test('模板继承', async () => {
    // 扩展模板 -> 创建工作流 -> 验证行为
  });

  test('冲突解决', async () => {
    // 创建冲突 -> 验证解决机制
  });
});
```

---

### 性能测试

**性能目标**：

| 操作 | 目标延迟 | 测试方法 |
|------|----------|----------|
| 映射操作 | < 10ms | 1000 次映射的平均时间 |
| 同步操作 | < 100ms | 端到端同步时间 |
| 模板创建 | < 50ms | 从模板创建工作流的时间 |
| 事件处理 | < 20ms | 事件监听和处理的时间 |

**性能测试代码**：
```javascript
describe('Performance', () => {
  test('映射操作应该在 10ms 内完成', async () => {
    const mapper = new PhaseMapper();
    mapper.registerRule({
      from: 'axiom:draft',
      to: ['omc:planning']
    });

    const start = Date.now();
    for (let i = 0; i < 1000; i++) {
      mapper.map('axiom:draft');
    }
    const duration = Date.now() - start;

    expect(duration / 1000).toBeLessThan(10);
  });
});
```

---

## 迁移指南

### 向后兼容性保证

**现有代码无需修改**：

```javascript
// 旧代码（继续工作）
import { createWorkflowIntegration } from './src/core/workflow-integration.js';

const workflow = createWorkflowIntegration();
const instanceId = workflow.startWorkflow('omc-default');
await workflow.transitionToNext(instanceId);
```

---

### 迁移步骤

#### 步骤 1：安装新版本

```bash
# 更新依赖
npm install

# 运行测试确保兼容性
npm test
```

#### 步骤 2：逐步迁移到新 API

**迁移示例 1：基本工作流**

```javascript
// 旧方式
const workflow = createWorkflowIntegration();
const id = workflow.startWorkflow('omc-default', { project: 'my-app' });

// 新方式（推荐）
const orchestrator = new WorkflowOrchestrator();
const id = orchestrator.startWorkflow('omc-default', { project: 'my-app' });
```

**迁移示例 2：使用模板**

```javascript
// 旧方式（手动配置）
const workflow = createWorkflowIntegration();
workflow.registerWorkflow({
  id: 'my-tdd',
  phases: ['RED', 'GREEN', 'REFACTOR'],
  transitions: {
    'RED': ['GREEN'],
    'GREEN': ['REFACTOR'],
    'REFACTOR': []
  }
});
const id = workflow.startWorkflow('my-tdd');

// 新方式（使用模板）
const orchestrator = new WorkflowOrchestrator();
const id = await orchestrator.startTDDWorkflow({ feature: 'auth' });
```

**迁移示例 3：阶段映射**

```javascript
// 旧方式（硬编码）
const omcPhase = workflow.mapAxiomToOMC('axiom:draft');

// 新方式（智能映射）
const omcPhases = await orchestrator.mapPhase('axiom:draft', {
  complexity: 'high',
  requiresDesign: true
});
```

**迁移示例 4：同步工作流**

```javascript
// 旧方式（手动同步）
const axiomId = workflow.startWorkflow('axiom-default');
const omcId = workflow.startWorkflow('omc-default');
await workflow.transitionToNext(axiomId);
// 手动映射和同步
const axiomInstance = workflow.getWorkflowInstance(axiomId);
const mappedPhase = workflow.mapAxiomToOMC(axiomInstance.currentPhase);
await workflow.transitionTo(omcId, mappedPhase);

// 新方式（自动同步）
const { axiomInstanceId, omcInstanceId } =
  await orchestrator.createSyncedWorkflowPair('axiom-default', 'omc-default');
await orchestrator.transitionToNext(axiomInstanceId);
// OMC 自动同步，无需手动操作
```

#### 步骤 3：启用新功能

```javascript
// 启用自动同步
orchestrator.setAutoSync(true);

// 设置同步策略
orchestrator.setSyncStrategy('intelligent');

// 注册自定义映射规则
orchestrator.registerMappingRule({
  id: 'my-rule',
  from: 'custom:phase',
  to: ['target:phase'],
  condition: (context) => context.myCondition
});
```

---

### 迁移检查清单

- [ ] 安装新版本
- [ ] 运行现有测试确保兼容性
- [ ] 识别可以使用模板的工作流
- [ ] 迁移到模板 API
- [ ] 识别需要自动同步的工作流
- [ ] 配置同步策略
- [ ] 添加自定义映射规则（如需要）
- [ ] 更新文档和注释
- [ ] 运行完整测试套件
- [ ] 部署到生产环境

---

## 性能考虑

### 优化策略

#### 1. 映射规则缓存

```javascript
class PhaseMapper {
  constructor() {
    this.cache = new LRUCache({ max: 100 });
  }

  map(fromPhase, context = {}) {
    const cacheKey = `${fromPhase}:${JSON.stringify(context)}`;

    if (this.cache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.cache.get(cacheKey);
    }

    const result = this._performMapping(fromPhase, context);
    this.cache.set(cacheKey, result);
    return result;
  }
}
```

#### 2. 异步同步

```javascript
class AutoSyncEngine {
  async _handlePhaseChange(event) {
    // 不阻塞主流程
    setImmediate(async () => {
      const links = this.syncLinks.get(event.instanceId) || [];
      for (const link of links) {
        await this.sync(event.instanceId, link.targetId);
      }
    });
  }
}
```

#### 3. 批量操作

```javascript
class WorkflowOrchestrator {
  async registerMappingRules(rules) {
    // 批量注册，减少事件触发
    const ruleIds = [];
    for (const rule of rules) {
      ruleIds.push(this.phaseMapper.registerRule(rule));
    }
    this.emit('rulesRegistered', ruleIds);
    return ruleIds;
  }
}
```

#### 4. 懒加载模板

```javascript
class TemplateManager {
  constructor() {
    this.templates = new Map();
    this.templateLoaders = new Map();
  }

  registerTemplateLoader(id, loader) {
    this.templateLoaders.set(id, loader);
  }

  getTemplate(id) {
    if (!this.templates.has(id) && this.templateLoaders.has(id)) {
      const loader = this.templateLoaders.get(id);
      const template = loader();
      this.templates.set(id, template);
    }
    return this.templates.get(id);
  }
}
```

---

### 性能监控

```javascript
class WorkflowOrchestrator {
  getPerformanceMetrics() {
    return {
      mapping: {
        averageTime: this.phaseMapper.getAverageTime(),
        cacheHitRate: this.phaseMapper.getCacheHitRate()
      },
      sync: {
        averageTime: this.autoSyncEngine.getAverageTime(),
        successRate: this.autoSyncEngine.getSuccessRate()
      },
      templates: {
        creationTime: this.templateManager.getAverageCreationTime()
      }
    };
  }
}
```

---

## 总结

本设计方案通过引入**混合式架构**，在保持向后兼容的前提下，显著增强了工作流整合能力：

### 核心改进

1. **智能映射引擎（PhaseMapper）**
   - 支持灵活的一对多、多对多映射
   - 支持条件映射和自定义映射函数
   - 性能优化：映射操作 < 10ms

2. **自动同步引擎（AutoSyncEngine）**
   - 三种同步策略：主从、双向、智能
   - 自动冲突解决
   - 完整的同步历史记录

3. **模板管理器（TemplateManager）**
   - 5 个预定义模板（TDD、调试、代码审查、功能开发、重构）
   - 支持模板继承和参数化
   - 模板验证机制

4. **工作流协调器（WorkflowOrchestrator）**
   - 统一的高层 API
   - 简化使用复杂度
   - 完整的监控和统计

### 关键优势

- ✅ **向后兼容**：现有代码无需修改
- ✅ **易于使用**：简洁的高层 API
- ✅ **高性能**：优化的映射和同步机制
- ✅ **可扩展**：清晰的架构，易于添加新功能
- ✅ **可测试**：高测试覆盖率（> 90%）
- ✅ **文档完善**：完整的 API 文档和使用指南

### 下一步

1. 获得团队审批
2. 按照实施阶段逐步开发
3. 持续测试和优化
4. 收集用户反馈
5. 迭代改进

---

**文档版本**: 1.0
**最后更新**: 2026-02-17
**状态**: 待审批
