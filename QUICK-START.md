# Axiom-OMC Integration - 快速入门指南

**版本**: 2.1.0
**更新日期**: 2026-02-17

---

## 🎯 5 分钟快速上手

本指南将帮助你在 5 分钟内开始使用 Axiom-OMC Integration 的所有核心功能。

---

## 📦 安装

```bash
# 克隆仓库
git clone https://github.com/liangjie559567/axiom-omc-integration.git
cd axiom-omc-integration

# 安装依赖
npm install

# 运行测试（可选）
npm test
```

---

## 🚀 三大核心系统

### 1️⃣ 技能系统（Skills）

**14 个 Superpowers 技能，开箱即用**

#### 在 Claude Code 中使用

```bash
# 头脑风暴和需求澄清
/brainstorming

# 测试驱动开发
/test-driven-development

# 系统化调试
/systematic-debugging

# 编写实现计划
/writing-plans

# 执行计划
/executing-plans
```

#### 查看所有技能

```bash
ls skills/
```

**技能列表**:
- `brainstorming` - 头脑风暴
- `writing-plans` - 编写计划
- `executing-plans` - 执行计划
- `test-driven-development` - TDD
- `systematic-debugging` - 调试
- `verification-before-completion` - 验证
- `requesting-code-review` - 请求审查
- `receiving-code-review` - 接收审查
- `dispatching-parallel-agents` - 并行代理
- `using-git-worktrees` - Git 工作树
- `subagent-driven-development` - 子代理开发
- `finishing-a-development-branch` - 完成分支
- `using-superpowers` - 使用指南
- `writing-skills` - 技能开发

---

### 2️⃣ 钩子系统（Hooks）

**事件驱动的自动化扩展**

#### 快速测试

```bash
# 运行钩子系统测试
node test-hooks.js
```

#### 基本使用

```javascript
import { hookSystem } from './src/core/HookSystem.js';

// 1. 加载钩子配置
await hookSystem.loadFromConfig('./hooks/hooks.json');

// 2. 注册自定义钩子
hookSystem.registerFunctionHook('MyEvent', (context) => {
  console.log('事件触发:', context.event);
  console.log('数据:', context.data);
});

// 3. 触发钩子
await hookSystem.executeHooks('MyEvent', {
  data: { message: 'Hello World' }
});
```

#### 配置钩子

编辑 `hooks/hooks.json`:

```json
{
  "hooks": [
    {
      "event": "WorkflowStart",
      "type": "command",
      "command": "echo '工作流启动: ${workflowName}'",
      "async": true
    },
    {
      "event": "SessionStart",
      "type": "command",
      "command": "bash hooks/session-start.sh",
      "async": true
    }
  ]
}
```

#### 支持的事件

- `SessionStart` - 会话启动
- `WorkflowStart` - 工作流启动
- `WorkflowEnd` - 工作流完成
- `CommandExecute` - 命令执行

---

### 3️⃣ 命令系统（Commands）

**动态加载的插件化命令**

#### 快速测试

```bash
# 运行命令系统测试
node test-commands.js
```

#### 基本使用

```javascript
import { commandSystem } from './src/core/CommandSystem.js';
import { PluginLoader } from './src/core/PluginLoader.js';

// 1. 加载命令
const loader = new PluginLoader(commandSystem);
await loader.loadDirectory('./commands');

// 2. 执行命令
const result = await commandSystem.executeCommand('help');
console.log(result.result);

// 3. 列出所有命令
await commandSystem.executeCommand('list');

// 4. 查看系统状态
await commandSystem.executeCommand('status --verbose');

// 5. 启动工作流
await commandSystem.executeCommand('workflow:start brainstorming');
```

#### 内置命令

| 命令 | 别名 | 说明 |
|------|------|------|
| `help` | `h`, `?` | 显示帮助 |
| `list` | `ls`, `commands` | 列出命令 |
| `status` | `stat`, `info` | 系统状态 |
| `version` | `v`, `ver` | 版本信息 |
| `workflow:start` | `wf:start` | 启动工作流 |
| `workflow:list` | `wf:list` | 列出工作流 |

#### 命令示例

```bash
# 显示帮助
help

# 显示特定命令帮助
help workflow:start

# 列出所有命令
list

# 按分组过滤
list --group=workflow

# 搜索命令
list --search=start

# 查看状态
status
status --verbose

# 启动工作流
workflow:start brainstorming
wf:start test-driven-development

# 列出工作流
workflow:list
workflow:list --active
```

---

## 🔧 开发自定义功能

### 创建自定义命令

```javascript
// commands/custom/my-command.js
export default {
  name: 'my-command',
  description: '我的自定义命令',
  aliases: ['mc'],
  group: 'custom',

  async execute(parsed, context) {
    const arg = parsed.args[0] || 'World';
    return `Hello, ${arg}!`;
  }
};
```

加载并使用:

```javascript
await loader.loadPlugin('./commands/custom/my-command.js');
await commandSystem.executeCommand('my-command Claude');
// 输出: Hello, Claude!
```

### 创建自定义钩子

```javascript
// 注册函数钩子
hookSystem.registerFunctionHook('CustomEvent', async (context) => {
  console.log('自定义事件触发');

  // 访问上下文数据
  const { workflowName, phase } = context;

  // 执行自定义逻辑
  await doSomething(workflowName, phase);
});

// 触发钩子
await hookSystem.executeHooks('CustomEvent', {
  workflowName: 'my-workflow',
  phase: 'start'
});
```

### 创建自定义技能

1. 在 `skills/` 目录创建新文件夹
2. 添加 `skill.md` 文件
3. 使用 Markdown 格式编写技能内容
4. 在 Claude Code 中使用 `/your-skill-name`

参考 `skills/writing-skills/skill.md` 了解技能开发最佳实践。

---

## 📊 完整示例

### 示例 1: 完整工作流

```javascript
import { commandSystem } from './src/core/CommandSystem.js';
import { hookSystem } from './src/core/HookSystem.js';
import { PluginLoader } from './src/core/PluginLoader.js';

// 初始化系统
const loader = new PluginLoader(commandSystem);
await loader.loadDirectory('./commands');
await hookSystem.loadFromConfig('./hooks/hooks.json');

// 查看系统状态
console.log('=== 系统状态 ===');
const status = await commandSystem.executeCommand('status');
console.log(status.result);

// 列出所有命令
console.log('\n=== 可用命令 ===');
const list = await commandSystem.executeCommand('list');
console.log(list.result);

// 启动工作流（会触发 WorkflowStart 钩子）
console.log('\n=== 启动工作流 ===');
const start = await commandSystem.executeCommand('workflow:start brainstorming');
console.log(start.result);

// 列出活动工作流
console.log('\n=== 活动工作流 ===');
const workflows = await commandSystem.executeCommand('workflow:list --active');
console.log(workflows.result);
```

### 示例 2: 自定义集成

```javascript
import { commandSystem } from './src/core/CommandSystem.js';
import { hookSystem } from './src/core/HookSystem.js';

// 注册自定义命令
commandSystem.registerCommand({
  name: 'deploy',
  description: '部署应用',
  aliases: ['d'],
  group: 'deployment',

  async execute(parsed, context) {
    const env = parsed.flags.env || 'staging';

    // 触发部署前钩子
    await hookSystem.executeHooks('PreDeploy', { env });

    // 执行部署
    console.log(`部署到 ${env} 环境...`);

    // 触发部署后钩子
    await hookSystem.executeHooks('PostDeploy', { env });

    return `✅ 成功部署到 ${env}`;
  }
});

// 注册部署钩子
hookSystem.registerFunctionHook('PreDeploy', async (context) => {
  console.log(`准备部署到 ${context.env}...`);
  // 运行测试、构建等
});

hookSystem.registerFunctionHook('PostDeploy', async (context) => {
  console.log(`部署完成: ${context.env}`);
  // 发送通知、更新状态等
});

// 使用
await commandSystem.executeCommand('deploy --env=production');
```

---

## 🧪 运行测试

```bash
# 钩子系统测试
node test-hooks.js

# 命令系统测试
node test-commands.js

# 插件测试
node test-plugin-manual.js

# 核心系统测试
npm test
```

---

## 📚 进阶学习

### 文档资源

1. **[最终集成总结](./FINAL-INTEGRATION-SUMMARY.md)**
   - 完整项目概览
   - 所有功能说明

2. **[钩子系统使用指南](./docs/HookSystem.md)**
   - 详细 API 文档
   - 高级用法

3. **[命令系统完成报告](./PLAN-C-INTEGRATION-COMPLETE.md)**
   - 命令系统架构
   - 开发指南

4. **[技能系统完成报告](./SUPERPOWERS-100-PERCENT-INTEGRATION.md)**
   - 14 个技能详解
   - 使用场景

### 示例代码

查看以下文件了解实际用法:

- `test-hooks.js` - 钩子系统示例
- `test-commands.js` - 命令系统示例
- `commands/core/*.js` - 内置命令实现
- `hooks/hooks.json` - 钩子配置示例

---

## 🎯 常见使用场景

### 场景 1: 自动化工作流

```javascript
// 配置钩子自动化工作流
{
  "hooks": [
    {
      "event": "WorkflowStart",
      "type": "command",
      "command": "git checkout -b feature/${workflowName}",
      "async": false
    },
    {
      "event": "WorkflowEnd",
      "type": "command",
      "command": "npm test && git push",
      "async": false
    }
  ]
}
```

### 场景 2: 自定义命令集

```javascript
// 创建项目特定的命令
commandSystem.registerCommands([
  {
    name: 'build',
    description: '构建项目',
    execute: async () => {
      // 构建逻辑
    }
  },
  {
    name: 'test',
    description: '运行测试',
    execute: async () => {
      // 测试逻辑
    }
  },
  {
    name: 'deploy',
    description: '部署应用',
    execute: async () => {
      // 部署逻辑
    }
  }
]);
```

### 场景 3: 集成 CI/CD

```javascript
// 在 CI/CD 中使用
import { commandSystem } from './src/core/CommandSystem.js';

// 运行测试
await commandSystem.executeCommand('test --coverage');

// 构建
await commandSystem.executeCommand('build --production');

// 部署
await commandSystem.executeCommand('deploy --env=production');
```

---

## 💡 最佳实践

### 1. 技能使用

- ✅ 在项目开始时使用 `/brainstorming`
- ✅ 编写代码前使用 `/writing-plans`
- ✅ 开发时使用 `/test-driven-development`
- ✅ 遇到问题时使用 `/systematic-debugging`
- ✅ 完成前使用 `/verification-before-completion`

### 2. 钩子配置

- ✅ 使用异步钩子避免阻塞主流程
- ✅ 添加错误处理避免钩子失败影响系统
- ✅ 使用条件匹配器精确控制钩子触发
- ✅ 合理使用变量展开简化配置

### 3. 命令开发

- ✅ 提供清晰的命令描述
- ✅ 添加有用的别名
- ✅ 实现参数验证
- ✅ 返回有意义的结果
- ✅ 处理错误情况

---

## 🆘 故障排除

### 问题 1: 命令加载失败

```bash
# 检查命令文件格式
node -c commands/core/help.js

# 查看加载日志
node test-commands.js
```

### 问题 2: 钩子不执行

```bash
# 验证钩子配置
cat hooks/hooks.json | jq

# 测试钩子系统
node test-hooks.js
```

### 问题 3: 技能不可用

```bash
# 检查技能文件
ls -la skills/

# 验证技能格式
cat skills/brainstorming/skill.md
```

---

## 🎉 开始使用

现在你已经了解了所有核心功能！

**推荐学习路径**:

1. ✅ 运行测试脚本熟悉系统
2. ✅ 在 Claude Code 中使用技能
3. ✅ 配置自定义钩子
4. ✅ 创建自定义命令
5. ✅ 阅读详细文档

**需要帮助？**

- 📖 查看 [完整文档](./FINAL-INTEGRATION-SUMMARY.md)
- 🐛 提交 [Issue](https://github.com/liangjie559567/axiom-omc-integration/issues)
- 💬 参与讨论

---

**祝你使用愉快！** 🚀
