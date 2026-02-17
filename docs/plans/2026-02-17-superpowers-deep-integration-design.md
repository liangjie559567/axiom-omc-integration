# Superpowers 深度集成设计方案

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标**: 将 Superpowers 的完整插件系统架构深度融合到 axiom-omc-integration 中

**架构**: 混合式深度融合 - 保留双方优势，创建统一适配层，支持双格式并行

**技术栈**: Node.js 18+, ES Modules, Jest, Markdown, JSON, YAML

---

## 📊 当前状态分析

### 已完成集成
- ✅ **技能层面**: 14/14 技能完整集成（100%）
- ✅ **测试覆盖**: 726 测试用例，95%+ 覆盖率
- ✅ **Agent 系统**: 32 个专业 Agent
- ✅ **命令系统**: 21 个命令（JavaScript 实现）

### 待集成组件
- ❌ **插件配置系统**: .claude-plugin/
- ❌ **Markdown 命令**: commands/markdown/
- ❌ **统一钩子配置**: hooks/hooks.json
- ❌ **核心库对齐**: lib/ 功能对比
- ❌ **技能专用测试**: tests/skills/

---

## 🎯 集成方案：混合式深度融合

### 核心理念
1. **保留现有架构** - 不破坏 Axiom-OMC 现有功能
2. **添加适配层** - 统一 Superpowers 和 Axiom-OMC 标准
3. **双格式支持** - Markdown + JavaScript 命令并存
4. **渐进迁移** - 新功能优先使用 Superpowers 标准

### 架构设计

```
axiom-omc-integration/
├── .claude-plugin/              # 新增：Superpowers 插件配置
│   ├── plugin.json             # 插件元数据
│   └── marketplace.json        # 市场信息
├── commands/                    # 增强：混合命令系统
│   ├── markdown/               # 新增：Superpowers 风格
│   │   ├── brainstorm.md
│   │   ├── write-plan.md
│   │   └── execute-plan.md
│   └── javascript/             # 现有：Axiom-OMC 风格
│       └── (保持现有命令)
├── hooks/                       # 增强：统一钩子系统
│   ├── hooks.json              # 新增：JSON 配置
│   ├── adapters/               # 新增：适配器
│   └── (保持现有 HookSystem)
├── skills/                      # 已完成：14/14 技能
└── src/
    ├── adapters/               # 新增：适配层
    │   ├── CommandAdapter.js   # 命令适配器
    │   ├── HookAdapter.js      # 钩子适配器
    │   └── PluginConfigManager.js  # 配置管理器
    └── core/                   # 现有系统（保持）
```

---

## 🔧 关键组件设计

### 1. CommandAdapter（命令适配器）

**职责**：统一 Markdown 和 JavaScript 命令格式

**核心方法**：
```javascript
class CommandAdapter {
  loadMarkdownCommand(path) {
    // 解析 Markdown frontmatter
    // 提取 description, disable-model-invocation
    // 转换为统一 Command 对象
  }

  loadJavaScriptCommand(path) {
    // 保持现有逻辑
    // 返回统一 Command 对象
  }
}
```

---

### 2. HookAdapter（钩子适配器）

**职责**：统一钩子配置和执行

**核心方法**：
```javascript
class HookAdapter {
  loadHooksConfig(jsonPath) {
    // 解析 hooks.json
    // 注册到 HookSystem
  }

  executeHook(event, context) {
    // 统一执行逻辑
  }
}
```

---

### 3. PluginConfigManager（配置管理器）

**职责**：管理 .claude-plugin/ 配置

**核心方法**：
```javascript
class PluginConfigManager {
  loadPluginConfig() {
    // 读取 plugin.json
  }

  syncToPackageJson() {
    // 同步版本、描述等
  }
}
```

---

## 📋 实施计划

### 阶段1：基础设施（1-2天）

**任务1.1：创建目录结构**
- 创建 `.claude-plugin/`
- 创建 `commands/markdown/`
- 创建 `hooks/adapters/`
- 创建 `src/adapters/`

**任务1.2：添加配置文件**
- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`
- `hooks/hooks.json`

**任务1.3：创建适配器骨架**
- `src/adapters/CommandAdapter.js`
- `src/adapters/HookAdapter.js`
- `src/adapters/PluginConfigManager.js`

---

### 阶段2：命令系统（2-3天）

**任务2.1：实现 CommandAdapter**
- Markdown 解析器
- Frontmatter 提取
- 命令注册逻辑

**任务2.2：迁移命令**
- 创建 Markdown 版本
- 保留 JavaScript 版本
- 双格式测试

---

### 阶段3：钩子系统（2-3天）

**任务3.1：实现 HookAdapter**
- JSON 配置解析
- 钩子事件映射
- 执行器适配

**任务3.2：统一配置**
- 创建 hooks.json
- 迁移现有钩子
- 测试生命周期

---

### 阶段4：测试增强（1-2天）

**任务4.1：添加测试**
- 适配器单元测试
- 集成测试
- 回归测试

**任务4.2：验证覆盖率**
- 确保 >90% 覆盖
- 性能测试

---

### 阶段5：文档发布（1天）

**任务5.1：更新文档**
- 架构文档
- API 指南
- 迁移指南

**任务5.2：版本发布**
- 更新到 v2.1.0
- 发布说明

---

## ✅ 验收标准

### 功能完整性
- ✅ 5个系统组件全部集成
- ✅ 双格式命令正常工作
- ✅ 钩子系统统一配置
- ✅ 适配器无缝运行

### 质量指标
- ✅ 测试覆盖率 ≥ 90%
- ✅ 所有测试通过
- ✅ 无破坏性变更
- ✅ 性能无退化

### 文档完整性
- ✅ 架构文档更新
- ✅ API 文档完整
- ✅ 迁移指南清晰

---

## 🎯 成功指标

- **集成完整度**: 100%（5/5 组件）
- **测试覆盖率**: ≥ 90%
- **向后兼容性**: 100%
- **文档完整度**: 100%

---

## 📝 下一步

1. **用户审批**: 确认设计方案
2. **创建实施计划**: 使用 writing-plans 技能
3. **开始实施**: 使用 executing-plans 技能

