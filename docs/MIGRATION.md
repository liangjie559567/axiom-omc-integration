# 架构重构迁移指南

## 概述

本文档指导如何从 v1 迁移到 v2 架构。

## v1 vs v2 对比

| 特性 | v1 | v2 |
|------|----|----|
| 架构模式 | 传统 | 事件溯源 + CQRS |
| 性能 | 基准 | 提升 70%+ |
| 扩展性 | 中 | 高 |

## 迁移步骤

### 1. 安装依赖

无需额外依赖，v2 使用相同的依赖。

### 2. 代码迁移示例

**v1 代码：**
```javascript
import { WorkflowOrchestrator } from 'axiom-omc-integration';
const orchestrator = new WorkflowOrchestrator(workflowIntegration);
```

**v2 代码：**
```javascript
import { WorkflowOrchestrator } from 'axiom-omc-integration/v2';
import { CommandHandler, QueryHandler } from 'axiom-omc-integration/cqrs';

const orchestrator = new WorkflowOrchestrator(commandHandler, queryHandler);
```

### 3. 完整示例

```javascript
import { EventStore } from 'axiom-omc-integration/core';
import { EventBus } from 'axiom-omc-integration/core';
import { CommandHandler, QueryHandler, ReadModel } from 'axiom-omc-integration/cqrs';
import { WorkflowOrchestrator } from 'axiom-omc-integration/v2';

// 初始化
const store = new EventStore();
const bus = new EventBus();
const readModel = new ReadModel();

const commandHandler = new CommandHandler(store, bus);
const queryHandler = new QueryHandler(readModel);

// 创建协调器
const orchestrator = new WorkflowOrchestrator(commandHandler, queryHandler);

// 使用
await orchestrator.startWorkflow('my-workflow', { data: 'test' });
```
