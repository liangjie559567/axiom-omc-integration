# v2 部署指南

## 前置条件

- Node.js >= 18.0.0
- npm >= 9.0.0

## 安装步骤

### 1. 安装依赖
```bash
npm install
```

### 2. 运行测试
```bash
npm test -- tests/unit/v2/
```

### 3. 使用v2架构
```javascript
import { EventStore, EventBus } from './src/core';
import { CommandHandler, QueryHandler, ReadModel } from './src/cqrs';
import { WorkflowOrchestrator } from './src/v2';

const store = new EventStore();
const bus = new EventBus();
const readModel = new ReadModel();

const cmd = new CommandHandler(store, bus);
const query = new QueryHandler(readModel);

const orchestrator = new WorkflowOrchestrator(cmd, query);
```

## 验证部署

```bash
npm test
```

预期结果：所有测试通过
