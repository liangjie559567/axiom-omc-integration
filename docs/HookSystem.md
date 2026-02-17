# HookSystem - 钩子系统使用指南

## 概述

HookSystem 是 Axiom-OMC Integration 的事件驱动钩子系统，提供标准化的事件钩子机制。

## 特性

- ✅ 事件注册和触发
- ✅ 同步/异步钩子执行
- ✅ 条件匹配器（正则表达式）
- ✅ 命令和函数钩子
- ✅ 错误隔离（钩子失败不影响主流程）
- ✅ 统计信息和监控

## 架构

```
┌─────────────────────────────────────────────────────────┐
│                     HookSystem                          │
├─────────────────────────────────────────────────────────┤
│  - 事件注册                                              │
│  - 钩子管理                                              │
│  - 执行调度                                              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   HookExecutor                          │
├─────────────────────────────────────────────────────────┤
│  - 命令执行器（Shell 命令）                              │
│  - 函数执行器（JavaScript 函数）                         │
│  - 变量展开                                              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   HookContext                           │
├─────────────────────────────────────────────────────────┤
│  - 事件名称                                              │
│  - 事件数据                                              │
│  - 时间戳                                                │
└─────────────────────────────────────────────────────────┘
```

## 支持的事件类型

### 核心事件

| 事件名称 | 触发时机 | 数据 |
|---------|---------|------|
| `SessionStart` | 会话启动 | `{ action }` |
| `WorkflowStart` | 工作流启动 | `{ instanceId, workflowId, workflowName, initialPhase }` |
| `WorkflowEnd` | 工作流完成 | `{ instanceId, workflowId, workflowName, duration }` |
| `CommandExecute` | 命令执行 | `{ commandName, args }` |
| `AgentDispatch` | Agent 调度 | `{ agentId, agentName, task }` |

### 自定义事件

你可以定义和触发自定义事件：

```javascript
hookSystem.executeHooks('CustomEvent', {
  customData: 'value'
});
```

## 使用方法

### 1. 配置文件方式（推荐）

创建 `hooks/hooks.json`：

```json
{
  "hooks": {
    "WorkflowStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Workflow started: ${WORKFLOW_NAME}'",
            "async": false
          }
        ]
      }
    ],
    "WorkflowEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/workflow-end.sh ${WORKFLOW_NAME}",
            "async": true
          }
        ]
      }
    ]
  }
}
```

加载配置：

```javascript
import { hookSystem } from './src/core/HookSystem.js';

await hookSystem.loadFromConfig('./hooks/hooks.json');
```

### 2. 编程方式

#### 注册函数钩子

```javascript
hookSystem.registerFunctionHook('WorkflowStart', (context) => {
  console.log(`工作流启动: ${context.data.workflowName}`);
}, {
  async: false
});
```

#### 注册命令钩子

```javascript
hookSystem.registerHook('WorkflowEnd', {
  hooks: [{
    type: 'command',
    command: 'echo "Workflow completed"',
    async: false
  }]
});
```

#### 带匹配器的钩子

```javascript
hookSystem.registerHook('CommandExecute', {
  matcher: 'commit|push',  // 只匹配 commit 或 push 命令
  hooks: [{
    type: 'function',
    function: (context) => {
      console.log(`Git 命令: ${context.data.commandName}`);
    },
    async: false
  }]
});
```

### 3. 触发钩子

```javascript
// 在代码中触发钩子
await hookSystem.executeHooks('WorkflowStart', {
  workflowName: 'brainstorming',
  WORKFLOW_NAME: 'brainstorming'
});
```

## 钩子类型

### 命令钩子（Command Hook）

执行 Shell 命令：

```json
{
  "type": "command",
  "command": "echo 'Hello from hook'",
  "async": false
}
```

**变量展开**：

- `${VAR}` - 环境变量或上下文变量
- `$VAR` - 环境变量

示例：

```json
{
  "type": "command",
  "command": "./hooks/notify.sh ${WORKFLOW_NAME} ${USER}",
  "async": true
}
```

### 函数钩子（Function Hook）

执行 JavaScript 函数：

```javascript
{
  type: 'function',
  function: (context) => {
    console.log(`Event: ${context.event}`);
    console.log(`Data:`, context.data);
  },
  async: false
}
```

## 同步 vs 异步

### 同步钩子（async: false）

- 等待钩子执行完成
- 可以获取返回值
- 适合关键操作

```json
{
  "type": "command",
  "command": "git status",
  "async": false
}
```

### 异步钩子（async: true）

- 不等待钩子执行完成
- 立即返回
- 适合通知、日志等非关键操作

```json
{
  "type": "command",
  "command": "./hooks/send-notification.sh",
  "async": true
}
```

## 匹配器（Matcher）

使用正则表达式匹配事件：

```json
{
  "matcher": "startup|resume|clear",
  "hooks": [...]
}
```

匹配逻辑：

1. 检查 `data.action`
2. 检查 `data.name`
3. 检查 `event` 名称

示例：

```javascript
// 只在 startup 或 resume 时执行
hookSystem.registerHook('SessionStart', {
  matcher: 'startup|resume',
  hooks: [...]
});

// 触发
await hookSystem.executeHooks('SessionStart', {
  action: 'startup'  // 匹配成功
});
```

## 错误处理

钩子系统具有错误隔离机制：

- ✅ 钩子失败不影响主流程
- ✅ 钩子失败不影响其他钩子
- ✅ 错误会被记录到日志
- ✅ 统计信息包含失败次数

```javascript
const result = await hookSystem.executeHooks('TestEvent');

console.log(result);
// {
//   event: 'TestEvent',
//   executed: 2,
//   results: [
//     { type: 'function', success: true },
//     { type: 'command', success: false, error: '...' }
//   ]
// }
```

## 统计信息

获取钩子系统统计：

```javascript
const stats = hookSystem.getStats();

console.log(stats);
// {
//   registered: 10,    // 已注册钩子数
//   executed: 50,      // 已执行次数
//   failed: 2,         // 失败次数
//   events: 5,         // 事件类型数
//   hooks: 10          // 总钩子数
// }
```

## 集成示例

### WorkflowIntegration 集成

```javascript
import { hookSystem } from './HookSystem.js';

class WorkflowIntegration {
  async startWorkflow(workflowId, context) {
    // ... 启动工作流逻辑

    // 触发钩子
    await hookSystem.executeHooks('WorkflowStart', {
      instanceId,
      workflowId,
      workflowName: workflow.name,
      WORKFLOW_NAME: workflow.name
    });

    return instanceId;
  }

  async completeWorkflow(instanceId) {
    // ... 完成工作流逻辑

    // 触发钩子
    await hookSystem.executeHooks('WorkflowEnd', {
      instanceId,
      workflowName: workflow.name,
      WORKFLOW_NAME: workflow.name,
      duration: completedAt - startedAt
    });

    return true;
  }
}
```

### CommandRouter 集成

```javascript
import { hookSystem } from './HookSystem.js';

class CommandRouter {
  async execute(commandName, args) {
    // 触发钩子
    await hookSystem.executeHooks('CommandExecute', {
      commandName,
      COMMAND_NAME: commandName,
      args
    });

    // ... 执行命令逻辑
  }
}
```

## 示例钩子脚本

### session-start.sh

```bash
#!/bin/bash
echo "================================================"
echo "  Axiom-OMC Integration - Session Started"
echo "================================================"
echo "Time: $(date)"
echo "User: ${USER}"
echo "Working Directory: $(pwd)"
echo ""
echo "Available Workflows:"
echo "  - brainstorming"
echo "  - writing-plans"
echo "  - executing-plans"
echo "================================================"
```

### workflow-start.sh

```bash
#!/bin/bash
WORKFLOW_NAME="${1:-Unknown}"

echo "================================================"
echo "  Starting Workflow: ${WORKFLOW_NAME}"
echo "================================================"
echo "Time: $(date)"

case "${WORKFLOW_NAME}" in
  "brainstorming")
    echo "📋 Brainstorming Workflow"
    echo "   - Clarify requirements"
    echo "   - Explore design options"
    ;;
  "test-driven-development")
    echo "🧪 TDD Workflow"
    echo "   - RED: Write failing test"
    echo "   - GREEN: Make it pass"
    echo "   - REFACTOR: Improve code"
    ;;
esac

echo "================================================"
```

## 最佳实践

### 1. 使用配置文件

✅ 推荐：

```json
{
  "hooks": {
    "WorkflowStart": [...]
  }
}
```

❌ 避免：

```javascript
// 硬编码在代码中
hookSystem.registerHook('WorkflowStart', ...);
```

### 2. 异步执行非关键操作

✅ 推荐：

```json
{
  "type": "command",
  "command": "./hooks/send-notification.sh",
  "async": true  // 通知不影响主流程
}
```

### 3. 使用匹配器减少不必要的执行

✅ 推荐：

```json
{
  "matcher": "commit|push",
  "hooks": [...]
}
```

### 4. 提供有意义的上下文数据

✅ 推荐：

```javascript
await hookSystem.executeHooks('WorkflowStart', {
  workflowName: 'brainstorming',
  WORKFLOW_NAME: 'brainstorming',  // 用于命令展开
  initialPhase: 'draft'
});
```

### 5. 错误处理

```javascript
try {
  await hookSystem.executeHooks('CustomEvent', data);
} catch (error) {
  logger.error(`钩子执行失败: ${error.message}`);
  // 继续主流程
}
```

## 调试

### 启用详细日志

```javascript
import { Logger } from './logger.js';

const logger = new Logger('HookSystem');
logger.setLevel('debug');
```

### 查看统计信息

```javascript
const stats = hookSystem.getStats();
console.log('钩子统计:', stats);
```

### 测试钩子

```javascript
// 测试特定事件的钩子
const result = await hookSystem.executeHooks('TestEvent', {
  test: 'data'
});

console.log('执行结果:', result);
```

## 故障排除

### 钩子未执行

1. 检查事件名称是否正确
2. 检查匹配器是否匹配
3. 检查钩子是否已注册

```javascript
const stats = hookSystem.getStats();
console.log(`已注册 ${stats.events} 个事件`);
```

### 命令钩子失败

1. 检查命令路径是否正确
2. 检查脚本是否有执行权限
3. 检查环境变量是否正确

```bash
chmod +x hooks/session-start.sh
```

### 变量未展开

1. 确保使用 `${VAR}` 格式
2. 确保变量在上下文数据中
3. 检查环境变量是否设置

```javascript
await hookSystem.executeHooks('Event', {
  WORKFLOW_NAME: 'test'  // 确保提供变量
});
```

## 性能考虑

- ✅ 使用异步钩子处理耗时操作
- ✅ 使用匹配器减少不必要的执行
- ✅ 避免在钩子中执行阻塞操作
- ✅ 监控钩子执行时间

## 安全考虑

- ⚠️ 验证命令钩子的来源
- ⚠️ 避免在钩子中执行不受信任的代码
- ⚠️ 限制钩子的文件系统访问
- ⚠️ 使用最小权限原则

## 总结

HookSystem 提供了强大而灵活的事件钩子机制，使 Axiom-OMC Integration 具有高度的可扩展性。通过合理使用钩子系统，你可以：

- ✅ 在关键事件点插入自定义逻辑
- ✅ 实现松耦合的系统集成
- ✅ 提供插件化的扩展能力
- ✅ 增强系统的可观测性

## 参考资料

- [Superpowers 钩子系统](https://github.com/obra/superpowers/tree/main/hooks)
- [WorkflowIntegration 文档](./workflow-integration.md)
- [测试示例](../../tests/core/HookSystem.test.js)
