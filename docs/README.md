# Axiom-OMC Integration 插件文档

> 统一的智能开发工作流平台 - 集成 32 个专业代理和 7 个核心技能

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/liangjie559567/axiom-omc-integration/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📖 目录

- [快速开始](#快速开始)
- [核心功能](#核心功能)
- [技能系统](#技能系统)
- [代理系统](#代理系统)
- [使用指南](#使用指南)
- [文档导航](#文档导航)

---

## 🚀 快速开始

### 安装插件

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

### 第一个技能

```bash
# 使用头脑风暴技能
/axiom-omc:brainstorming
```

---

## ⚡ 核心功能

### 1. 智能代理系统

32 个专业代理自动处理不同类型的任务：

- **分析类**：需求分析、架构设计、问题调试
- **执行类**：代码实现、任务规划、流程编排
- **审查类**：代码风格、质量审查、安全审查、API审查、性能审查
- **领域专家**：前端、后端、数据库、DevOps、移动端、数据科学、机器学习
- **工具类**：构建修复、依赖管理、Git操作、文档编写

### 2. 技能系统

7 个核心技能覆盖完整开发流程：

| 技能 | 用途 | 调用命令 |
|------|------|----------|
| brainstorming | 头脑风暴和需求探索 | `/axiom-omc:brainstorming` |
| systematic-debugging | 系统化调试 | `/axiom-omc:systematic-debugging` |
| test-driven-development | 测试驱动开发 | `/axiom-omc:test-driven-development` |
| executing-plans | 执行实现计划 | `/axiom-omc:executing-plans` |
| writing-plans | 编写实现计划 | `/axiom-omc:writing-plans` |
| requesting-code-review | 请求代码审查 | `/axiom-omc:requesting-code-review` |
| receiving-code-review | 接收代码审查 | `/axiom-omc:receiving-code-review` |

### 3. 工作流编排

- 4 种执行模式
- 自动状态同步
- 模板管理
- 并行执行支持

### 4. 记忆管理

- 决策记录
- 知识图谱
- 向量搜索

---

## 🎯 使用指南

### 典型工作流

#### 新功能开发

```bash
# 1. 头脑风暴需求
/axiom-omc:brainstorming

# 2. 编写实现计划
/axiom-omc:writing-plans

# 3. 测试驱动开发
/axiom-omc:test-driven-development

# 4. 执行计划
/axiom-omc:executing-plans

# 5. 请求代码审查
/axiom-omc:requesting-code-review
```

#### Bug 修复

```bash
# 1. 系统化调试
/axiom-omc:systematic-debugging

# 2. 编写复现测试
/axiom-omc:test-driven-development

# 3. 验证修复
/axiom-omc:verification-before-completion
```

---

## 📚 文档导航

### 详细文档

- **[插件使用指南](./PLUGIN-GUIDE.md)** - 完整的插件使用说明
- **[技能系统文档](./SKILLS.md)** - 7 个技能的详细说明
- **[代理系统文档](./AGENTS.md)** - 32 个代理的职责和使用场景

### 快速链接

- [GitHub 仓库](https://github.com/liangjie559567/axiom-omc-integration)
- [问题反馈](https://github.com/liangjie559567/axiom-omc-integration/issues)
- [版本发布](https://github.com/liangjie559567/axiom-omc-integration/releases)

---

## 🔧 故障排除

### 插件未加载

1. 确认已重启 Claude Code
2. 检查插件列表：`/plugin`
3. 重新安装：`/plugin install axiom-omc@axiom-omc-integration`

### 技能无法调用

1. 确认技能名称正确（使用 `/axiom-omc:` 前缀）
2. 查看可用技能列表
3. 检查插件是否正确加载

---

## 📞 支持与反馈

- **GitHub Issues**: https://github.com/liangjie559567/axiom-omc-integration/issues
- **文档**: https://github.com/liangjie559567/axiom-omc-integration
- **许可证**: MIT

---

## 🎉 开始使用

现在就开始使用 Axiom-OMC Integration 插件，体验智能化的开发工作流！

```bash
/axiom-omc:brainstorming
```

---

**Made with ❤️ by Axiom-OMC Integration Team**
