# Axiom-OMC Integration 插件文档

## 📖 目录

1. [快速开始](#快速开始)
2. [核心功能](#核心功能)
3. [技能系统](#技能系统)
4. [代理系统](#代理系统)
5. [使用指南](#使用指南)

---

## 🚀 快速开始

### 安装

```bash
# 添加插件市场
/plugin marketplace add liangjie559567/axiom-omc-integration

# 安装插件
/plugin install axiom-omc@axiom-omc-integration
```

### 验证安装

```bash
# 查看已安装插件
/plugin

# 重启 Claude Code 加载插件
```

---

## ⚡ 核心功能

### 1. 智能代理系统
- 32个专业代理
- 自动任务分配
- 并行执行支持

### 2. 工作流编排
- 4种执行模式
- 自动状态同步
- 模板管理

### 3. 记忆管理
- 决策记录
- 知识图谱
- 向量搜索

---

## 🎯 使用指南

### 调用技能

所有技能使用 `/axiom-omc:技能名` 格式调用：

```bash
# 头脑风暴
/axiom-omc:brainstorming

# 系统化调试
/axiom-omc:systematic-debugging

# 测试驱动开发
/axiom-omc:test-driven-development

# 执行计划
/axiom-omc:executing-plans

# 编写计划
/axiom-omc:writing-plans

# 请求代码审查
/axiom-omc:requesting-code-review

# 接收代码审查
/axiom-omc:receiving-code-review
```

### 使用代理

代理会根据任务自动分配，也可以通过技能显式调用特定代理。

### 工作流示例

#### 1. 新功能开发流程

```bash
# 步骤1：头脑风暴需求
/axiom-omc:brainstorming

# 步骤2：编写实现计划
/axiom-omc:writing-plans

# 步骤3：测试驱动开发
/axiom-omc:test-driven-development

# 步骤4：执行计划
/axiom-omc:executing-plans

# 步骤5：请求代码审查
/axiom-omc:requesting-code-review
```

#### 2. Bug 修复流程

```bash
# 步骤1：系统化调试
/axiom-omc:systematic-debugging

# 步骤2：测试驱动开发（编写复现测试）
/axiom-omc:test-driven-development

# 步骤3：验证修复
/axiom-omc:verification-before-completion
```

---

## 📚 更多文档

- [技能系统详细说明](./SKILLS.md)
- [代理系统详细说明](./AGENTS.md)
- [项目主页](https://github.com/liangjie559567/axiom-omc-integration)

---

## 🐛 故障排除

### 插件未加载

1. 确认已重启 Claude Code
2. 检查插件列表：`/plugin`
3. 重新安装：`/plugin install axiom-omc@axiom-omc-integration`

### 技能无法调用

1. 确认技能名称正确（使用 `/axiom-omc:` 前缀）
2. 查看可用技能列表
3. 检查插件是否正确加载

---

## 📞 支持

- GitHub Issues: https://github.com/liangjie559567/axiom-omc-integration/issues
- 文档: https://github.com/liangjie559567/axiom-omc-integration/blob/main/README.md
