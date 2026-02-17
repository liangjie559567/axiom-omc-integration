# v2 快速参考

## 初始化
```javascript
import { EventStore, EventBus } from './src/core';
import { CommandHandler, QueryHandler, ReadModel } from './src/cqrs';

const store = new EventStore();
const bus = new EventBus();
const readModel = new ReadModel();
```

## 创建处理器
```javascript
const cmd = new CommandHandler(store, bus);
const query = new QueryHandler(readModel);
```

## 使用
```javascript
import { WorkflowOrchestrator } from './src/v2';

const orchestrator = new WorkflowOrchestrator(cmd, query);
await orchestrator.startWorkflow('test', {});
```
