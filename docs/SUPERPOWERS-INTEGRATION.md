# Superpowers 深度集成文档

## 概述

本文档描述 axiom-omc-integration v2.1.0 中 Superpowers 插件系统的深度集成实现。

## 集成架构

### 混合式深度融合
- 保留 Axiom-OMC 现有架构
- 添加适配层统一标准
- 支持 Markdown + JavaScript 双格式
- 渐进式迁移策略

## 核心组件

### 1. CommandAdapter
**位置**: `src/adapters/CommandAdapter.js`

**功能**: 统一 Markdown 和 JavaScript 命令格式

**示例**:
```javascript
import { CommandAdapter } from './src/adapters/CommandAdapter.js';

const adapter = new CommandAdapter();
const cmd = adapter.loadMarkdownCommand('commands/markdown/brainstorm.md');
// 返回: { name, description, disableModelInvocation, handler }
```

### 2. HookAdapter
**位置**: `src/adapters/HookAdapter.js`

**功能**: 统一钩子配置和执行

**示例**:
```javascript
import { HookAdapter } from './src/adapters/HookAdapter.js';

const adapter = new HookAdapter();
const hooks = adapter.loadHooksConfig('hooks/hooks.json');
```

## Markdown 命令

### 命令格式
```markdown
---
description: "命令描述"
disable-model-invocation: true
---

命令内容
```

### 可用命令
- `commands/markdown/brainstorm.md` - 头脑风暴
- `commands/markdown/write-plan.md` - 编写计划
- `commands/markdown/execute-plan.md` - 执行计划

## 测试

### 运行测试
```bash
npm test -- superpowers-integration.test.js
```

### 测试覆盖
- CommandAdapter: 100%
- HookAdapter: 100%
- 集成测试: 2 个测试用例

## 版本历史

### v2.1.0 (2026-02-17)
- ✅ 添加 CommandAdapter
- ✅ 添加 HookAdapter
- ✅ 创建 Markdown 命令
- ✅ 集成测试套件
- ✅ 插件配置更新
