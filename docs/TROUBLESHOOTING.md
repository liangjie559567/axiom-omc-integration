# 故障排除指南

本指南帮助您快速诊断和解决 Axiom-OMC 集成中的常见问题。

## 目录

- [安装问题](#安装问题)
- [工作流问题](#工作流问题)
- [映射问题](#映射问题)
- [同步问题](#同步问题)
- [性能问题](#性能问题)
- [测试问题](#测试问题)
- [调试技巧](#调试技巧)

---

## 安装问题

### 问题：npm install 失败

**症状**：
```bash
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**解决方案**：
1. 清除 npm 缓存：
   ```bash
   npm cache clean --force
   ```

2. 删除 node_modules 和 package-lock.json：
   ```bash
   rm -rf node_modules package-lock.json
   ```

3. 重新安装：
   ```bash
   npm install
   ```

4. 如果仍然失败，使用 `--legacy-peer-deps`：
   ```bash
   npm install --legacy-peer-deps
   ```

### 问题：Node.js 版本不兼容

**症状**：
```bash
Error: The engine "node" is incompatible with this module
```

**解决方案**：
1. 检查 Node.js 版本：
   ```bash
   node --version
   ```

2. 确保使用 Node.js 18.x 或更高版本

3. 使用 nvm 切换版本：
   ```bash
   nvm install 18
   nvm use 18
   ```

---

## 工作流问题

### 问题：工作流启动失败

**症状**：
```javascript
Error: 工作流不存在: my-workflow
```

**原因**：
- 工作流 ID 不存在
- 工作流未注册

**解决方案**：
1. 检查可用的工作流：
   ```javascript
   const workflows = workflowIntegration.getAllWorkflows();
   console.log(workflows);
   ```

2. 确保工作流已注册：
   ```javascript
   workflowIntegration.registerWorkflow({
     id: 'my-workflow',
     name: 'My Workflow',
     type: 'axiom',
     phases: ['draft', 'review', 'implement']
   });
   ```

### 问题：阶段转换失败

**症状**：
```javascript
Error: 阶段转换验证失败: draft -> implement
```

**原因**：
- 不允许的阶段转换
- 工作流定义中没有配置该转换

**解决方案**：
1. 检查工作流的转换规则：
   ```javascript
   const workflow = workflowIntegration.getWorkflow('axiom-default');
   console.log(workflow.transitions);
   ```

2. 使用允许的转换路径：
   ```javascript
   // 错误：直接从 draft 跳到 implement
   await workflowIntegration.transitionTo(instanceId, 'implement');

   // 正确：按顺序转换
   await workflowIntegration.transitionTo(instanceId, 'review');
   await workflowIntegration.transitionTo(instanceId, 'implement');
   ```

3. 或者使用 `transitionToNext()`：
   ```javascript
   await workflowIntegration.transitionToNext(instanceId);
   ```

### 问题：工作流实例不存在

**症状**：
```javascript
Error: 工作流实例不存在: 123-456-789
```

**原因**：
- 实例 ID 错误
- 实例已被删除

**解决方案**：
1. 检查活跃的工作流实例：
   ```javascript
   const instances = workflowIntegration.getActiveWorkflows();
   console.log(instances);
   ```

2. 验证实例 ID：
   ```javascript
   const instance = workflowIntegration.getWorkflowInstance(instanceId);
   if (!instance) {
     console.log('实例不存在');
   }
   ```

---

## 映射问题

### 问题：映射规则不生效

**症状**：
```javascript
// 映射返回空数组
const result = phaseMapper.map('draft');
console.log(result); // []
```

**原因**：
- 映射规则未注册
- 源阶段名称不匹配

**解决方案**：
1. 检查已注册的规则：
   ```javascript
   const rules = phaseMapper.getAllRules();
   console.log(rules);
   ```

2. 确保规则已注册：
   ```javascript
   phaseMapper.registerRule({
     from: 'draft',
     to: ['planning']
   });
   ```

3. 检查阶段名称大小写：
   ```javascript
   // 错误：大小写不匹配
   phaseMapper.map('Draft'); // 规则是 'draft'

   // 正确
   phaseMapper.map('draft');
   ```

### 问题：条件映射不工作

**症状**：
```javascript
// 条件映射返回空数组
const result = phaseMapper.map('testing', { testType: 'unit' });
console.log(result); // []
```

**原因**：
- 条件函数返回 false
- 上下文参数不匹配

**解决方案**：
1. 检查条件函数：
   ```javascript
   phaseMapper.registerRule({
     from: 'testing',
     to: ['unit-testing'],
     condition: (context) => {
       console.log('Context:', context); // 调试输出
       return context.testType === 'unit';
     }
   });
   ```

2. 确保传递正确的上下文：
   ```javascript
   // 错误：上下文键名不匹配
   phaseMapper.map('testing', { type: 'unit' });

   // 正确
   phaseMapper.map('testing', { testType: 'unit' });
   ```

### 问题：反向映射失败

**症状**：
```javascript
const result = phaseMapper.reverseMap('planning');
console.log(result); // []
```

**原因**：
- 没有规则映射到该目标阶段

**解决方案**：
1. 检查是否有规则映射到目标阶段：
   ```javascript
   const rules = phaseMapper.getAllRules();
   const matchingRules = rules.filter(r => r.to.includes('planning'));
   console.log(matchingRules);
   ```

2. 注册正确的映射规则：
   ```javascript
   phaseMapper.registerRule({
     from: 'draft',
     to: ['planning']
   });
   ```

---

## 同步问题

### 问题：自动同步不工作

**症状**：
- 阶段转换后，目标工作流没有同步

**原因**：
- 同步引擎未启动
- 工作流未链接
- 映射规则缺失

**解决方案**：
1. 确保同步引擎已启动：
   ```javascript
   syncEngine.start();
   console.log('同步引擎运行中:', syncEngine.isRunning);
   ```

2. 检查工作流链接：
   ```javascript
   const links = syncEngine.getLinkedWorkflows(sourceId);
   console.log('链接的工作流:', links);
   ```

3. 确保映射规则存在：
   ```javascript
   const result = phaseMapper.map('draft');
   console.log('映射结果:', result);
   ```

4. 完整的设置流程：
   ```javascript
   // 1. 配置映射规则
   phaseMapper.registerRule({
     from: 'draft',
     to: ['planning']
   });

   // 2. 启动同步引擎
   syncEngine.start();

   // 3. 链接工作流
   await syncEngine.linkWorkflows(axiomId, omcId);

   // 4. 转换阶段（会自动同步）
   await workflowIntegration.transitionTo(axiomId, 'review');
   ```

### 问题：同步循环检测

**症状**：
```javascript
Error: 检测到循环同步
```

**原因**：
- 双向同步配置错误
- 工作流相互触发

**解决方案**：
1. 使用单向同步（master-slave）：
   ```javascript
   await syncEngine.linkWorkflows(masterId, slaveId, {
     strategy: 'master-slave'
   });
   ```

2. 避免循环链接：
   ```javascript
   // 错误：循环链接
   await syncEngine.linkWorkflows(id1, id2);
   await syncEngine.linkWorkflows(id2, id1); // 会导致循环

   // 正确：单向链接
   await syncEngine.linkWorkflows(id1, id2);
   ```

### 问题：同步历史查询慢

**症状**：
- `getSyncHistory()` 调用很慢

**原因**：
- 历史记录过多
- 未使用索引查询

**解决方案**：
1. 使用实例 ID 过滤（使用索引）：
   ```javascript
   // 慢：查询所有历史
   const history = syncEngine.getSyncHistory();

   // 快：使用索引查询
   const history = syncEngine.getSyncHistory({
     instanceId: myInstanceId
   });
   ```

2. 限制返回数量：
   ```javascript
   const history = syncEngine.getSyncHistory({
     instanceId: myInstanceId,
     limit: 10
   });
   ```

3. 配置历史记录限制：
   ```javascript
   const syncEngine = new AutoSyncEngine(
     workflowIntegration,
     phaseMapper,
     { maxHistorySize: 500 } // 减少历史记录数量
   );
   ```

---

## 性能问题

### 问题：映射查找慢

**症状**：
- `phaseMapper.map()` 调用很慢

**原因**：
- 规则数量过多（已优化为 O(1)）

**解决方案**：
1. 确保使用最新版本（已优化）：
   ```javascript
   // v1.0.1+ 已优化为 O(1) 查找
   const result = phaseMapper.map('draft');
   ```

2. 运行性能基准测试：
   ```bash
   node examples/phase-mapper-benchmark.js
   ```

3. 如果仍然慢，检查条件函数：
   ```javascript
   phaseMapper.registerRule({
     from: 'testing',
     to: ['unit-testing'],
     condition: (context) => {
       // 避免复杂的计算
       return context.testType === 'unit';
     }
   });
   ```

### 问题：内存使用过高

**症状**：
- 应用内存持续增长

**原因**：
- 同步历史记录过多
- 工作流实例未清理

**解决方案**：
1. 配置历史记录限制：
   ```javascript
   const syncEngine = new AutoSyncEngine(
     workflowIntegration,
     phaseMapper,
     { maxHistorySize: 1000 }
   );
   ```

2. 定期清理完成的工作流：
   ```javascript
   // 清理已完成的工作流
   const completed = workflowIntegration.getCompletedWorkflows();
   completed.forEach(instance => {
     workflowIntegration.deleteWorkflowInstance(instance.id);
   });
   ```

3. 销毁不再使用的同步引擎：
   ```javascript
   syncEngine.destroy();
   ```

---

## 测试问题

### 问题：测试超时

**症状**：
```bash
Timeout - Async callback was not invoked within the 5000 ms timeout
```

**原因**：
- 异步操作未完成
- 事件监听器未清理

**解决方案**：
1. 增加超时时间：
   ```javascript
   test('my test', async () => {
     // ...
   }, 10000); // 10 秒超时
   ```

2. 确保异步操作完成：
   ```javascript
   test('sync test', async () => {
     await syncEngine.linkWorkflows(id1, id2);
     await workflowIntegration.transitionTo(id1, 'review');

     // 等待同步完成
     await new Promise(resolve => setTimeout(resolve, 100));
   });
   ```

3. 清理事件监听器：
   ```javascript
   afterEach(() => {
     syncEngine.stop();
     syncEngine.destroy();
   });
   ```

### 问题：测试相互影响

**症状**：
- 单独运行测试通过，一起运行失败

**原因**：
- 共享状态未清理
- 单例实例冲突

**解决方案**：
1. 在每个测试前后清理：
   ```javascript
   beforeEach(() => {
     workflowIntegration = new WorkflowIntegration();
     phaseMapper = new PhaseMapper();
     syncEngine = new AutoSyncEngine(workflowIntegration, phaseMapper);
   });

   afterEach(() => {
     syncEngine.destroy();
   });
   ```

2. 使用独立的实例：
   ```javascript
   // 避免共享实例
   let workflowIntegration;
   let phaseMapper;
   let syncEngine;
   ```

---

## 调试技巧

### 启用详细日志

```javascript
// 设置日志级别
process.env.LOG_LEVEL = 'debug';

// 或在代码中
import { Logger } from './src/core/logger.js';
Logger.setLevel('debug');
```

### 使用调试工作流

```javascript
import { createDebugWorkflow } from './src/templates/debug-workflow.js';

const debugInstance = await createDebugWorkflow(workflowIntegration, {
  issueId: 'BUG-123',
  severity: 'high'
});
```

### 检查系统状态

```javascript
// 工作流状态
console.log('活跃工作流:', workflowIntegration.getActiveWorkflows());
console.log('工作流统计:', workflowIntegration.getStats());

// 映射状态
console.log('映射规则:', phaseMapper.getAllRules());
console.log('映射统计:', phaseMapper.getStats());

// 同步状态
console.log('同步链接:', syncEngine.getLinkedWorkflows());
console.log('同步统计:', syncEngine.getStats());
console.log('同步历史:', syncEngine.getSyncHistory({ limit: 10 }));
```

### 性能分析

```javascript
// 运行基准测试
console.time('mapping');
for (let i = 0; i < 10000; i++) {
  phaseMapper.map('draft');
}
console.timeEnd('mapping');

// 或使用专用基准测试
node examples/phase-mapper-benchmark.js
node examples/sync-history-benchmark.js
```

### 使用断点调试

在 VS Code 中创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

---

## 常见错误代码

| 错误代码 | 含义 | 解决方案 |
|---------|------|---------|
| `WORKFLOW_NOT_FOUND` | 工作流不存在 | 检查工作流 ID |
| `INSTANCE_NOT_FOUND` | 实例不存在 | 检查实例 ID |
| `INVALID_TRANSITION` | 无效的阶段转换 | 检查转换规则 |
| `MAPPING_NOT_FOUND` | 映射规则不存在 | 注册映射规则 |
| `SYNC_CYCLE_DETECTED` | 检测到同步循环 | 使用单向同步 |
| `INVALID_RULE` | 无效的映射规则 | 检查规则格式 |

---

## 获取帮助

如果以上方法都无法解决您的问题：

1. **查看示例代码**：
   - `examples/` 目录包含完整的使用示例

2. **运行测试**：
   ```bash
   npm test
   ```

3. **查看日志**：
   - 启用 debug 日志查看详细信息

4. **提交 Issue**：
   - 在 GitHub 上提交问题
   - 包含错误信息、代码示例和环境信息

5. **查看文档**：
   - README.md
   - API.md
   - ARCHITECTURE.md

---

## 最佳实践

1. **始终清理资源**：
   ```javascript
   syncEngine.destroy();
   ```

2. **使用错误处理**：
   ```javascript
   try {
     await workflowIntegration.transitionTo(id, 'review');
   } catch (error) {
     console.error('转换失败:', error);
   }
   ```

3. **验证输入**：
   ```javascript
   if (!instanceId) {
     throw new Error('实例 ID 是必需的');
   }
   ```

4. **使用类型检查**：
   ```javascript
   // 使用 JSDoc 注释
   /**
    * @param {string} instanceId
    * @param {string} targetPhase
    */
   async function transition(instanceId, targetPhase) {
     // ...
   }
   ```

5. **监控性能**：
   ```javascript
   const stats = syncEngine.getStats();
   if (stats.failedSyncs > 10) {
     console.warn('同步失败率过高');
   }
   ```
