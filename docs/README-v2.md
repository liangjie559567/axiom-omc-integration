# Axiom-OMC v2 架构

## 快速开始

```javascript
import { EventStore, EventBus } from './src/core';
import { CommandHandler, QueryHandler, ReadModel } from './src/cqrs';
import { WorkflowOrchestrator } from './src/v2';

// 初始化
const store = new EventStore();
const bus = new EventBus();
const readModel = new ReadModel();

const cmd = new CommandHandler(store, bus);
const query = new QueryHandler(readModel);

// 使用
const orchestrator = new WorkflowOrchestrator(cmd, query);
await orchestrator.startWorkflow('test', {});
```

## 测试

```bash
npm test -- tests/unit/core/
npm test -- tests/unit/cqrs/
npm test -- tests/unit/v2/
```
