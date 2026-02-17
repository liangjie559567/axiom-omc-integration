---
name: using-git-worktrees
description: 在开始需要与当前工作空间隔离的功能工作时使用，或在执行实现计划之前使用 - 创建隔离的 git worktree，具有智能目录选择和安全验证
---

# Git Worktree 技能

## 核心原则

**使用 Git worktree 隔离功能开发，保护主工作区不受影响。**

Git worktree 不是可选的，而是：
- ✅ 功能隔离
- ✅ 并行开发
- ✅ 安全实验
- ✅ 快速切换
- ❌ 不是分支切换
- ❌ 不是 stash

## 何时使用

### 必须使用的场景

**□ 开始新功能开发**
- 需要隔离的功能分支
- 可能破坏主工作区的实验
- 长期开发任务

**□ 执行实现计划**
- writing-plans 已完成
- 需要独立的工作环境
- 避免影响当前工作

**□ 并行开发**
- 同时开发多个功能
- 需要快速切换上下文
- 避免分支切换开销

**□ 代码审查**
- 审查他人的 PR
- 需要运行和测试代码
- 不影响当前工作

### 不适用的场景

**□ 简单的单文件修改**
- 快速修复
- 文档更新
- 配置调整

**□ 当前分支的继续工作**
- 已经在正确的分支
- 不需要隔离
- 不需要并行开发

---

## Git Worktree 基础

### 什么是 Worktree

**定义**: Git worktree 允许你同时检出多个分支到不同的目录。

**优势**:
- 每个 worktree 是独立的工作目录
- 共享同一个 .git 仓库
- 可以同时在多个分支工作
- 切换无需 stash 或 commit

**示例**:
```
project/
├── .git/                    # 主仓库
├── main/                    # 主 worktree (main 分支)
│   ├── src/
│   └── package.json
├── feature-auth/            # 功能 worktree (feature/auth 分支)
│   ├── src/
│   └── package.json
└── feature-api/             # 功能 worktree (feature/api 分支)
    ├── src/
    └── package.json
```

### 基本命令

**创建 worktree**:
```bash
# 创建新分支并检出到新目录
git worktree add ../feature-auth -b feature/auth

# 检出现有分支到新目录
git worktree add ../feature-auth feature/auth

# 从远程分支创建
git worktree add ../feature-auth -b feature/auth origin/feature/auth
```

**列出 worktree**:
```bash
git worktree list
```

**删除 worktree**:
```bash
# 删除目录后清理
git worktree remove ../feature-auth

# 或先删除目录，再清理
rm -rf ../feature-auth
git worktree prune
```

---

## Worktree 创建流程

### 阶段 1: 规划 Worktree

**任务**:
1. 确定功能名称
2. 选择基础分支
3. 确定 worktree 位置
4. 验证名称冲突

**规划输出**:
```markdown
## Worktree 规划

### 功能信息
- **功能名称**: user-authentication
- **分支名称**: feature/user-authentication
- **基础分支**: main
- **Worktree 路径**: ../axiom-omc-user-authentication

### 验证
- ✅ 分支名称不冲突
- ✅ 目录不存在
- ✅ 基础分支存在
```

### 阶段 2: 创建 Worktree

**任务**:
1. 创建新分支
2. 检出到新目录
3. 验证创建成功
4. 切换到新目录

**创建命令**:
```bash
# 1. 创建 worktree
git worktree add ../axiom-omc-user-authentication -b feature/user-authentication

# 2. 切换到新目录
cd ../axiom-omc-user-authentication

# 3. 验证
git branch --show-current
# 输出: feature/user-authentication

git status
# 输出: On branch feature/user-authentication
```

### 阶段 3: 环境设置

**任务**:
1. 安装依赖
2. 配置环境
3. 运行初始测试
4. 验证环境就绪

**设置步骤**:
```bash
# 1. 安装依赖
npm install

# 2. 复制环境配置
cp ../.env.example .env

# 3. 运行测试
npm test

# 4. 验证构建
npm run build
```

### 阶段 4: 开始开发

**任务**:
1. 确认环境就绪
2. 开始实现
3. 定期提交
4. 推送到远程

**开发流程**:
```bash
# 1. 确认分支
git branch --show-current

# 2. 开始开发
# [编写代码]

# 3. 提交更改
git add .
git commit -m "实现用户认证功能"

# 4. 推送到远程
git push -u origin feature/user-authentication
```

---

## Worktree 管理

### 列出所有 Worktree

```bash
$ git worktree list

/Users/user/projects/axiom-omc                    abc1234 [main]
/Users/user/projects/axiom-omc-user-auth         def5678 [feature/user-authentication]
/Users/user/projects/axiom-omc-api-refactor      ghi9012 [feature/api-refactor]
```

### 切换 Worktree

```bash
# 方法 1: 直接 cd
cd ../axiom-omc-user-auth

# 方法 2: 使用别名
alias wt-auth='cd /Users/user/projects/axiom-omc-user-auth'
wt-auth
```

### 删除 Worktree

**完成功能后删除**:
```bash
# 1. 确认功能已合并
git branch --merged main | grep feature/user-authentication

# 2. 切换回主 worktree
cd ../axiom-omc

# 3. 删除 worktree
git worktree remove ../axiom-omc-user-authentication

# 4. 删除远程分支（可选）
git push origin --delete feature/user-authentication

# 5. 删除本地分支
git branch -d feature/user-authentication
```

**强制删除（未合并）**:
```bash
# 1. 删除 worktree（强制）
git worktree remove ../axiom-omc-user-authentication --force

# 2. 删除分支（强制）
git branch -D feature/user-authentication
```

---

## 智能目录选择

### 目录命名约定

**推荐格式**: `<项目名>-<功能名>`

**示例**:
```
axiom-omc-user-authentication
axiom-omc-api-refactor
axiom-omc-database-migration
axiom-omc-ui-redesign
```

**优势**:
- 清晰的功能标识
- 易于查找和切换
- 避免名称冲突

### 目录位置选择

**选项 1: 平级目录（推荐）**
```
projects/
├── axiom-omc/                    # 主项目
├── axiom-omc-user-auth/          # 功能 1
└── axiom-omc-api-refactor/       # 功能 2
```

**优势**: 清晰分离，易于管理

**选项 2: 子目录**
```
axiom-omc/
├── .git/
├── main/                         # 主 worktree
├── worktrees/
│   ├── user-auth/                # 功能 1
│   └── api-refactor/             # 功能 2
```

**优势**: 集中管理，不污染父目录

### 自动化目录选择

**脚本示例**:
```bash
#!/bin/bash
# create-worktree.sh

FEATURE_NAME=$1
PROJECT_NAME=$(basename $(git rev-parse --show-toplevel))
WORKTREE_DIR="../${PROJECT_NAME}-${FEATURE_NAME}"

# 检查目录是否存在
if [ -d "$WORKTREE_DIR" ]; then
  echo "❌ 目录已存在: $WORKTREE_DIR"
  exit 1
fi

# 创建 worktree
git worktree add "$WORKTREE_DIR" -b "feature/${FEATURE_NAME}"

echo "✅ Worktree 创建成功: $WORKTREE_DIR"
echo "📂 切换到新目录: cd $WORKTREE_DIR"
```

**使用**:
```bash
$ ./create-worktree.sh user-authentication
✅ Worktree 创建成功: ../axiom-omc-user-authentication
📂 切换到新目录: cd ../axiom-omc-user-authentication
```

---

## 安全验证

### 创建前验证

**验证清单**:
```markdown
## 创建前验证

### 1. 分支验证
- [ ] 基础分支存在
- [ ] 新分支名称不冲突
- [ ] 远程分支不存在（或已同步）

### 2. 目录验证
- [ ] 目标目录不存在
- [ ] 父目录可写
- [ ] 磁盘空间充足

### 3. 状态验证
- [ ] 当前工作区干净（无未提交更改）
- [ ] 无未解决的合并冲突
- [ ] 远程仓库可访问
```

**验证脚本**:
```bash
#!/bin/bash
# verify-worktree.sh

FEATURE_NAME=$1
BRANCH_NAME="feature/${FEATURE_NAME}"
WORKTREE_DIR="../axiom-omc-${FEATURE_NAME}"

echo "🔍 验证 worktree 创建条件..."

# 1. 检查分支是否存在
if git show-ref --verify --quiet "refs/heads/${BRANCH_NAME}"; then
  echo "❌ 分支已存在: ${BRANCH_NAME}"
  exit 1
fi

# 2. 检查目录是否存在
if [ -d "$WORKTREE_DIR" ]; then
  echo "❌ 目录已存在: $WORKTREE_DIR"
  exit 1
fi

# 3. 检查工作区状态
if ! git diff-index --quiet HEAD --; then
  echo "❌ 工作区有未提交的更改"
  exit 1
fi

echo "✅ 所有验证通过，可以创建 worktree"
```

### 删除前验证

**验证清单**:
```markdown
## 删除前验证

### 1. 合并状态
- [ ] 功能已合并到主分支
- [ ] 或确认可以丢弃更改

### 2. 工作状态
- [ ] 无未提交的更改
- [ ] 或已备份重要更改

### 3. 依赖检查
- [ ] 无其他进程使用该目录
- [ ] 无打开的编辑器
```

---

## 常见场景

### 场景 1: 并行开发多个功能

**需求**: 同时开发用户认证和 API 重构

**步骤**:
```bash
# 1. 创建功能 1 worktree
git worktree add ../axiom-omc-user-auth -b feature/user-authentication
cd ../axiom-omc-user-auth
npm install
# [开发功能 1]

# 2. 创建功能 2 worktree
cd ../axiom-omc
git worktree add ../axiom-omc-api-refactor -b feature/api-refactor
cd ../axiom-omc-api-refactor
npm install
# [开发功能 2]

# 3. 快速切换
cd ../axiom-omc-user-auth      # 切换到功能 1
cd ../axiom-omc-api-refactor   # 切换到功能 2
cd ../axiom-omc                # 切换到主分支
```

### 场景 2: 代码审查

**需求**: 审查 PR #123

**步骤**:
```bash
# 1. 获取 PR 分支信息
gh pr view 123
# 分支: feature/new-feature

# 2. 创建审查 worktree
git worktree add ../axiom-omc-review-123 -b review/pr-123 origin/feature/new-feature

# 3. 切换到审查目录
cd ../axiom-omc-review-123

# 4. 安装依赖并测试
npm install
npm test
npm run build

# 5. 审查完成后删除
cd ../axiom-omc
git worktree remove ../axiom-omc-review-123
git branch -D review/pr-123
```

### 场景 3: 紧急修复

**需求**: 在开发功能时需要紧急修复 bug

**步骤**:
```bash
# 当前在功能分支
cd ../axiom-omc-user-auth

# 1. 创建修复 worktree
cd ../axiom-omc
git worktree add ../axiom-omc-hotfix -b hotfix/critical-bug

# 2. 切换到修复目录
cd ../axiom-omc-hotfix

# 3. 修复 bug
# [修复代码]
git add .
git commit -m "修复关键 bug"
git push -u origin hotfix/critical-bug

# 4. 创建 PR 并合并
gh pr create --title "修复关键 bug" --base main

# 5. 合并后删除
cd ../axiom-omc
git worktree remove ../axiom-omc-hotfix
git branch -d hotfix/critical-bug

# 6. 返回功能开发
cd ../axiom-omc-user-auth
```

---

## 最佳实践

### 1. 命名约定

**分支命名**:
```
feature/user-authentication
feature/api-refactor
bugfix/login-error
hotfix/security-patch
```

**目录命名**:
```
axiom-omc-user-authentication
axiom-omc-api-refactor
axiom-omc-login-error
axiom-omc-security-patch
```

### 2. 定期清理

**清理脚本**:
```bash
#!/bin/bash
# cleanup-worktrees.sh

echo "🧹 清理已合并的 worktrees..."

# 列出所有 worktree
git worktree list | while read -r line; do
  WORKTREE_PATH=$(echo "$line" | awk '{print $1}')
  BRANCH=$(echo "$line" | grep -oP '\[\K[^\]]+')

  # 跳过主 worktree
  if [ "$BRANCH" == "main" ]; then
    continue
  fi

  # 检查是否已合并
  if git branch --merged main | grep -q "$BRANCH"; then
    echo "🗑️  删除已合并的 worktree: $WORKTREE_PATH ($BRANCH)"
    git worktree remove "$WORKTREE_PATH"
    git branch -d "$BRANCH"
  fi
done

echo "✅ 清理完成"
```

### 3. 环境同步

**同步脚本**:
```bash
#!/bin/bash
# sync-worktree-env.sh

MAIN_DIR="../axiom-omc"
CURRENT_DIR=$(pwd)

echo "🔄 同步环境配置..."

# 复制环境文件
cp "$MAIN_DIR/.env" .env
cp "$MAIN_DIR/.env.local" .env.local 2>/dev/null || true

# 同步依赖
npm install

echo "✅ 环境同步完成"
```

---

## 与其他技能的配合

### 工作流程
```
using-git-worktrees (创建隔离环境) ← 当前技能
    ↓
writing-plans (实现规划)
    ↓
executing-plans (执行实现)
    ↓
verification-before-completion (验证完成)
    ↓
finishing-a-development-branch (完成开发分支)
```

### 配合原则
1. **隔离优先**: 功能开发前先创建 worktree
2. **环境独立**: 每个 worktree 有独立的依赖和配置
3. **并行开发**: 利用 worktree 实现真正的并行
4. **安全实验**: 在 worktree 中安全尝试新方案

---

## 记住

**Worktree 原则：**

1. **隔离开发** - 每个功能独立的工作环境
2. **并行工作** - 同时开发多个功能
3. **快速切换** - 无需 stash 或 commit
4. **安全实验** - 不影响主工作区
5. **定期清理** - 删除已合并的 worktree

**不要：**
- ❌ 在主工作区开发多个功能
- ❌ 频繁切换分支
- ❌ 使用 stash 保存未完成工作
- ❌ 忘记删除已合并的 worktree

**要：**
- ✅ 为每个功能创建 worktree
- ✅ 使用清晰的命名约定
- ✅ 定期清理已合并的 worktree
- ✅ 验证创建和删除条件

**现在开始使用 Git worktree。**
