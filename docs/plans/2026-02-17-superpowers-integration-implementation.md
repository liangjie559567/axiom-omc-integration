# Superpowers 深度集成实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标**: 实现 Superpowers 完整插件系统架构的深度融合

**架构**: 混合式深度融合 - 适配层 + 双格式支持

**技术栈**: Node.js 18+, ES Modules, Jest, Markdown, gray-matter, js-yaml

---

## 任务概览

| 任务 | 组件 | 工作量 | 优先级 |
|------|------|--------|--------|
| Task 1 | 目录结构 | 0.5天 | 🔴 高 |
| Task 2 | 插件配置 | 0.5天 | 🔴 高 |
| Task 3 | CommandAdapter | 1天 | 🔴 高 |
| Task 4 | Markdown命令 | 1天 | 🟡 中 |
| Task 5 | HookAdapter | 1天 | 🔴 高 |
| Task 6 | 钩子配置 | 1天 | 🟡 中 |
| Task 7 | 测试套件 | 2天 | 🔴 高 |
| Task 8 | 文档更新 | 1天 | 🟡 中 |

**总工作量**: 8天

---

## Task 1: 创建目录结构

**文件**:
- Create: `.claude-plugin/`
- Create: `commands/markdown/`
- Create: `hooks/adapters/`
- Create: `src/adapters/`

**步骤1: 创建插件配置目录**

```bash
mkdir -p .claude-plugin
```

**步骤2: 创建命令目录**

```bash
mkdir -p commands/markdown
```

**步骤3: 创建钩子适配器目录**

```bash
mkdir -p hooks/adapters
```

**步骤4: 创建源码适配器目录**

```bash
mkdir -p src/adapters
```

**步骤5: 验证目录结构**

```bash
ls -la .claude-plugin commands/markdown hooks/adapters src/adapters
```

预期: 所有目录创建成功

**步骤6: 提交**

```bash
git add .claude-plugin commands hooks/adapters src/adapters
git commit -m "🏗️ 创建 Superpowers 集成目录结构"
```

---

## Task 2: 创建插件配置文件

**文件**:
- Create: `.claude-plugin/plugin.json`
- Create: `.claude-plugin/marketplace.json`

**步骤1: 创建 plugin.json**

```json
{
  "name": "axiom-omc-integration",
  "description": "Unified intelligent development workflow platform",
  "version": "2.1.0",
  "author": {
    "name": "Axiom-OMC-Superpowers Team",
    "email": "team@axiom-omc.dev"
  },
  "homepage": "https://github.com/liangjie559567/axiom-omc-integration",
  "repository": "https://github.com/liangjie559567/axiom-omc-integration",
  "license": "MIT",
  "keywords": ["skills", "agents", "workflow", "integration"]
}
```

**步骤2: 创建 marketplace.json**

```json
{
  "displayName": "Axiom-OMC Integration",
  "category": "Development Tools",
  "tags": ["workflow", "agents", "automation"]
}
```

**步骤3: 验证配置**

```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json')))"
```

预期: JSON 格式正确

**步骤4: 提交**

```bash
git add .claude-plugin/
git commit -m "📦 添加 Claude 插件配置文件"
```

---

## Task 3: 实现 CommandAdapter

**文件**:
- Create: `src/adapters/CommandAdapter.js`
- Test: `tests/unit/adapters/CommandAdapter.test.js`

**步骤1: 安装依赖**

```bash
npm install gray-matter
```

**步骤2: 编写 CommandAdapter**

```javascript
import fs from 'fs';
import matter from 'gray-matter';

export class CommandAdapter {
  loadMarkdownCommand(path) {
    const content = fs.readFileSync(path, 'utf8');
    const { data, content: body } = matter(content);
    return {
      name: path.split('/').pop().replace('.md', ''),
      description: data.description || '',
      disableModelInvocation: data['disable-model-invocation'] || false,
      handler: () => body
    };
  }
}
```

**步骤3: 编写测试**

```javascript
import { CommandAdapter } from '../../../src/adapters/CommandAdapter.js';

describe('CommandAdapter', () => {
  test('加载 Markdown 命令', () => {
    const adapter = new CommandAdapter();
    const cmd = adapter.loadMarkdownCommand('commands/markdown/test.md');
    expect(cmd.name).toBe('test');
  });
});
```

**步骤4: 运行测试**

```bash
npm test -- CommandAdapter.test.js
```

预期: 测试通过

**步骤5: 提交**

```bash
git add src/adapters/CommandAdapter.js tests/unit/adapters/
git commit -m "✨ 实现 CommandAdapter 支持 Markdown 命令"
```

---

## Task 4: 创建 Markdown 命令

**文件**:
- Create: `commands/markdown/brainstorm.md`
- Create: `commands/markdown/write-plan.md`
- Create: `commands/markdown/execute-plan.md`

**步骤1: 创建 brainstorm.md**

```markdown
---
description: "You MUST use this before any creative work"
disable-model-invocation: true
---

Invoke the superpowers:brainstorming skill and follow it exactly
```

**步骤2: 创建 write-plan.md**

```markdown
---
description: "Create detailed implementation plans"
disable-model-invocation: true
---

Invoke the superpowers:writing-plans skill
```

**步骤3: 创建 execute-plan.md**

```markdown
---
description: "Execute implementation plans task-by-task"
disable-model-invocation: true
---

Invoke the superpowers:executing-plans skill
```

**步骤4: 测试命令加载**

```bash
node -e "const {CommandAdapter} = require('./src/adapters/CommandAdapter.js'); const a = new CommandAdapter(); console.log(a.loadMarkdownCommand('commands/markdown/brainstorm.md'))"
```

**步骤5: 提交**

```bash
git add commands/markdown/
git commit -m "📝 添加 Markdown 格式命令定义"
```

---

## Task 5: 实现 HookAdapter

**文件**:
- Create: `src/adapters/HookAdapter.js`
- Test: `tests/unit/adapters/HookAdapter.test.js`

**步骤1: 编写 HookAdapter**

```javascript
import fs from 'fs';

export class HookAdapter {
  loadHooksConfig(path) {
    const config = JSON.parse(fs.readFileSync(path, 'utf8'));
    return config.hooks;
  }

  executeHook(event, context) {
    // 执行钩子逻辑
  }
}
```

**步骤2: 编写测试**

```javascript
describe('HookAdapter', () => {
  test('加载钩子配置', () => {
    const adapter = new HookAdapter();
    const hooks = adapter.loadHooksConfig('hooks/hooks.json');
    expect(hooks).toBeDefined();
  });
});
```

**步骤3: 运行测试**

```bash
npm test -- HookAdapter.test.js
```

**步骤4: 提交**

```bash
git add src/adapters/HookAdapter.js tests/unit/adapters/
git commit -m "✨ 实现 HookAdapter 支持 JSON 配置"
```

---

## Task 6: 创建钩子配置

**文件**:
- Create: `hooks/hooks.json`

**步骤1: 创建 hooks.json**

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "command": "echo 'Axiom-OMC Session Started'"
      }
    ],
    "SessionEnd": [
      {
        "matcher": ".*",
        "command": "echo 'Session Ended'"
      }
    ]
  }
}
```

**步骤2: 验证配置**

```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('hooks/hooks.json')))"
```

**步骤3: 提交**

```bash
git add hooks/hooks.json
git commit -m "⚙️ 添加统一钩子配置文件"
```

---

## Task 7: 添加测试套件

**文件**:
- Create: `tests/integration/superpowers-integration.test.js`

**步骤1: 编写集成测试**

```javascript
describe('Superpowers Integration', () => {
  test('CommandAdapter 加载 Markdown 命令', () => {
    // 测试逻辑
  });

  test('HookAdapter 加载配置', () => {
    // 测试逻辑
  });
});
```

**步骤2: 运行测试**

```bash
npm test
```

预期: 所有测试通过，覆盖率 ≥ 90%

**步骤3: 提交**

```bash
git add tests/
git commit -m "✅ 添加 Superpowers 集成测试套件"
```

---

## Task 8: 更新文档

**文件**:
- Modify: `README.md`
- Modify: `docs/architecture.md`
- Create: `docs/SUPERPOWERS-INTEGRATION.md`

**步骤1: 更新 README**

添加集成说明章节

**步骤2: 更新架构文档**

添加适配层架构图

**步骤3: 创建集成文档**

详细说明集成细节

**步骤4: 提交**

```bash
git add README.md docs/
git commit -m "📚 更新文档：Superpowers 深度集成"
```

---

## 验收标准

- ✅ 所有 8 个任务完成
- ✅ 测试覆盖率 ≥ 90%
- ✅ 所有测试通过
- ✅ 文档完整

