# 🚀 快速使用示例

5 分钟快速上手 Axiom-OMC Integration！

---

## 示例 1: 列出所有 Agent

```javascript
import { createPlugin } from './src/plugin.js';

const plugin = createPlugin();
await plugin.activate();

const result = await plugin.executeCommand('agent:list');
console.log(`找到 ${result.agents.length} 个 Agent`);

// 输出前 5 个
result.agents.slice(0, 5).forEach(agent => {
    console.log(`- ${agent.id}: ${agent.name} (${agent.lane})`);
});

await plugin.destroy();
```

**输出:**
```
找到 32 个 Agent
- architect: System Architect (architect)
- tech-lead: Technical Lead (architect)
- api-designer: API Designer (architect)
- database-architect: Database Architect (architect)
- frontend-dev: Frontend Developer (executor)
```

---

## 示例 2: 执行 Agent

```javascript
import { createPlugin } from './src/plugin.js';

const plugin = createPlugin();
await plugin.activate();

// 执行架构师 Agent
const result = await plugin.executeCommand('agent:execute architect', {
    task: 'Design a REST API for user management',
    requirements: ['RESTful', 'Authentication', 'CRUD operations']
});

console.log('执行结果:', result.status);
console.log('执行 ID:', result.executionId);

await plugin.destroy();
```

---

## 示例 3: 启动工作流

```javascript
import { createPlugin } from './src/plugin.js';

const plugin = createPlugin();
await plugin.activate();

// 启动 OMC 工作流
const result = await plugin.executeCommand('workflow:start omc-default', {
    projectName: 'My Project',
    description: 'Building a web application'
});

console.log('工作流已启动:', result.instanceId);
console.log('当前阶段:', result.currentPhase);

await plugin.destroy();
```

---

## 示例 4: 使用记忆系统

```javascript
import { createPlugin } from './src/plugin.js';

const plugin = createPlugin();
await plugin.activate();

// 添加决策
await plugin.memorySystem.addDecision({
    title: 'Use PostgreSQL',
    description: 'Decided to use PostgreSQL for database',
    rationale: 'Need ACID compliance and complex queries',
    tags: ['database', 'architecture']
});

// 搜索知识
const results = await plugin.memorySystem.searchKnowledge('database');
console.log(`找到 ${results.length} 个相关知识`);

// 获取统计
const stats = await plugin.executeCommand('memory:stats');
console.log('记忆统计:', stats.stats);

await plugin.destroy();
```

---

## 示例 5: 在 Claude Code 中使用

在 Claude Code 中，您可以直接使用命令：

```
/plugin activate axiom-omc

/agent list
/agent info architect
/agent execute architect {"task": "Design API"}

/workflow list
/workflow start omc-default

/memory stats

/plugin info
/plugin status
```

---

## 示例 6: 使用 CLI

```bash
# 列出所有 Agent
node src/cli/index.js agent:list

# 获取 Agent 信息
node src/cli/index.js agent:info architect

# 执行 Agent
node src/cli/index.js agent:execute architect '{"task": "Design API"}'

# 启动工作流
node src/cli/index.js workflow:start omc-default

# 查看记忆统计
node src/cli/index.js memory:stats

# 插件信息
node src/cli/index.js plugin:info
```

---

## 示例 7: 完整的工作流程

```javascript
import { createPlugin } from './src/plugin.js';

async function completeWorkflow() {
    // 1. 创建并激活插件
    const plugin = createPlugin({
        memory: { storageDir: './.omc/memory' }
    });
    await plugin.activate();

    // 2. 启动工作流
    const workflow = await plugin.executeCommand('workflow:start omc-default', {
        projectName: 'E-commerce Platform'
    });
    console.log('✓ 工作流已启动:', workflow.instanceId);

    // 3. 执行架构设计
    const design = await plugin.executeCommand('agent:execute architect', {
        task: 'Design system architecture',
        context: { workflowId: workflow.instanceId }
    });
    console.log('✓ 架构设计完成');

    // 4. 记录决策
    await plugin.memorySystem.addDecision({
        title: 'Microservices Architecture',
        description: 'Use microservices for scalability',
        rationale: 'Better scalability and maintainability',
        tags: ['architecture', 'design'],
        metadata: { workflowId: workflow.instanceId }
    });
    console.log('✓ 决策已记录');

    // 5. 转换工作流阶段
    await plugin.executeCommand('workflow:goto', {
        instanceId: workflow.instanceId,
        phase: 'design'
    });
    console.log('✓ 工作流已进入设计阶段');

    // 6. 获取最终状态
    const status = await plugin.executeCommand('workflow:status', {
        instanceId: workflow.instanceId
    });
    console.log('✓ 当前状态:', status.currentPhase);

    await plugin.destroy();
}

completeWorkflow();
```

---

## 示例 8: 并发执行多个 Agent

```javascript
import { createPlugin } from './src/plugin.js';

async function parallelExecution() {
    const plugin = createPlugin();
    await plugin.activate();

    // 并发执行多个 Agent
    const results = await Promise.all([
        plugin.executeCommand('agent:execute frontend-dev', {
            task: 'Build user interface'
        }),
        plugin.executeCommand('agent:execute backend-dev', {
            task: 'Build API endpoints'
        }),
        plugin.executeCommand('agent:execute database-architect', {
            task: 'Design database schema'
        })
    ]);

    console.log('所有 Agent 执行完成:');
    results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.agentId}: ${result.status}`);
    });

    await plugin.destroy();
}

parallelExecution();
```

---

## 示例 9: 错误处理

```javascript
import { createPlugin } from './src/plugin.js';

async function withErrorHandling() {
    const plugin = createPlugin();

    try {
        await plugin.activate();

        // 尝试执行命令
        const result = await plugin.executeCommand('agent:execute invalid-agent', {
            task: 'Some task'
        });

        if (!result.success) {
            console.error('命令执行失败:', result.error);
        }
    } catch (error) {
        console.error('发生错误:', error.message);
    } finally {
        await plugin.destroy();
    }
}

withErrorHandling();
```

---

## 示例 10: 性能监控

```javascript
import { createPlugin } from './src/plugin.js';

async function performanceMonitoring() {
    const plugin = createPlugin();
    await plugin.activate();

    // 测量初始化时间
    const initStart = Date.now();
    await plugin.initialize();
    console.log(`初始化时间: ${Date.now() - initStart}ms`);

    // 测量命令执行时间
    const cmdStart = Date.now();
    await plugin.executeCommand('agent:list');
    console.log(`命令执行时间: ${Date.now() - cmdStart}ms`);

    // 获取插件状态
    const status = await plugin.executeCommand('plugin:status');
    console.log('插件状态:', status.status);

    await plugin.destroy();
}

performanceMonitoring();
```

---

## 更多示例

查看完整示例：
- [examples/basic-usage.js](./examples/basic-usage.js) - 基础用法
- [docs/USER-GUIDE.md](./docs/USER-GUIDE.md) - 用户指南
- [docs/API-REFERENCE.md](./docs/API-REFERENCE.md) - API 参考

---

## 运行示例

```bash
# 运行基础示例
node examples/basic-usage.js

# 运行手动测试（包含所有功能）
node test-plugin-manual.js
```

---

**开始使用吧！** 🚀
