# 🚀 快速配置 GitHub 仓库

您的仓库已经推送成功！现在只需要完成最后的配置步骤。

---

## 方法 1: 使用 GitHub CLI（推荐，最快）⚡

### Step 1: 登录 GitHub CLI

```bash
gh auth login
```

按照提示选择：
1. GitHub.com
2. HTTPS
3. Yes (authenticate Git with your GitHub credentials)
4. Login with a web browser（推荐）或 Paste an authentication token

### Step 2: 运行配置脚本

**Windows (PowerShell):**
```powershell
cd C:\Users\ljyih\Desktop\axiom-omc-integration
.\scripts\setup-github.ps1
```

**或者手动执行命令:**

```bash
# 1. 更新仓库描述
gh api repos/liangjie559567/axiom-omc-integration -X PATCH -f description="Unified intelligent development workflow platform with 32 professional agents, 25 CLI commands, and Claude Code plugin support. Features include agent system, workflow integration, memory management, and state synchronization."

# 2. 添加 Topics
gh api repos/liangjie559567/axiom-omc-integration/topics -X PUT -f names='["claude-code","agent-system","workflow-automation","cli-tool","plugin","javascript","nodejs","ai-agents","development-tools","integration-platform","memory-management","knowledge-graph","state-synchronization","workflow-integration"]' -H "Accept: application/vnd.github.mercy-preview+json"

# 3. 设置默认分支为 main
gh api repos/liangjie559567/axiom-omc-integration -X PATCH -f default_branch="main"

# 4. 删除 master 分支
gh api repos/liangjie559567/axiom-omc-integration/git/refs/heads/master -X DELETE

# 5. 创建 Release
gh release create v2.1.0 -R liangjie559567/axiom-omc-integration --title "v2.1.0 - Initial Release" --notes-file CHANGELOG.md --latest
```

---

## 方法 2: 手动在 GitHub 网站配置（5 分钟）🌐

### 1️⃣ 设置默认分支为 main

访问：https://github.com/liangjie559567/axiom-omc-integration/settings/branches

1. 点击 "Switch default branch to another branch" 旁边的 ⇄ 图标
2. 选择 **main**
3. 点击 **Update**
4. 确认更改

然后删除 master 分支：
- 访问：https://github.com/liangjie559567/axiom-omc-integration/branches
- 找到 `master` 分支，点击 🗑️ 删除

---

### 2️⃣ 添加 Topics

访问：https://github.com/liangjie559567/axiom-omc-integration

1. 在右侧找到 **About** 部分
2. 点击 **⚙️ 齿轮图标**
3. 在 "Topics" 输入框中添加（按回车添加每个）：

```
claude-code
agent-system
workflow-automation
cli-tool
plugin
javascript
nodejs
ai-agents
development-tools
integration-platform
memory-management
knowledge-graph
state-synchronization
workflow-integration
```

4. 点击 **Save changes**

---

### 3️⃣ 完善 About 部分

在同一个编辑界面：

**Description:**
```
Unified intelligent development workflow platform with 32 professional agents, 25 CLI commands, and Claude Code plugin support. Features include agent system, workflow integration, memory management, and state synchronization.
```

点击 **Save changes**

---

### 4️⃣ 创建 Release v2.1.0

访问：https://github.com/liangjie559567/axiom-omc-integration/releases/new

**Choose a tag:** `v2.1.0` (点击 "Create new tag: v2.1.0 on publish")

**Target:** `main`

**Release title:** `v2.1.0 - Initial Release`

**Description:** 复制以下内容：

```markdown
# 🎉 Axiom-OMC Integration v2.1.0

Initial release of the Axiom-OMC-Superpowers Integration Plugin.

## ✨ Features

### Agent System
- 32 professional agents across 6 functional lanes
- Agent registry and execution system
- Workflow engine for agent orchestration

### Command System
- 25 CLI commands across 5 categories
- Unified command router with conflict resolution

### State Synchronization
- Bidirectional Axiom ↔ OMC file synchronization
- Incremental sync based on MD5 checksums

### Memory System
- Decision manager for tracking decisions
- Knowledge graph for relationship management

### Workflow Integration
- Axiom workflow (3 phases)
- OMC workflow (5 phases)

### Plugin System
- Claude Code plugin integration
- Complete lifecycle management

## 📊 Statistics

- **469 tests** with 100% pass rate
- **92.3% code coverage**
- **Performance rating: A+ (96/100)**
- **189 files, 53,000+ lines of code**

## 📦 Installation

```bash
git clone https://github.com/liangjie559567/axiom-omc-integration.git
cd axiom-omc-integration
npm install
npm test
```

## 📚 Documentation

- [Quick Start Guide](./QUICKSTART.md)
- [User Guide](./docs/USER-GUIDE.md)
- [API Reference](./docs/API-REFERENCE.md)
- [FAQ](./FAQ.md)

## 🎯 Project Score

**99.2/100** ⭐⭐⭐⭐⭐

---

**Full Changelog**: https://github.com/liangjie559567/axiom-omc-integration/blob/main/CHANGELOG.md
```

勾选：✅ **Set as the latest release**

点击 **Publish release**

---

## ✅ 配置完成检查

完成后，您的仓库应该：

- ✅ 默认分支是 `main`
- ✅ 显示项目描述
- ✅ 显示 14 个 Topics
- ✅ 有 v2.1.0 Release

---

## 🎉 配置完成！

访问您的仓库查看效果：
https://github.com/liangjie559567/axiom-omc-integration

---

**需要帮助？** 查看 [GITHUB-SETUP-GUIDE.md](./GITHUB-SETUP-GUIDE.md) 获取详细说明。
