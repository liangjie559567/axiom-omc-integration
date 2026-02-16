# Axiom + OMC Integration Plugin 安装指南

本文档提供详细的安装、配置和故障排查指南。

## 目录

- [系统要求](#系统要求)
- [快速安装](#快速安装)
- [手动安装](#手动安装)
- [配置](#配置)
- [验证安装](#验证安装)
- [故障排查](#故障排查)
- [卸载](#卸载)

## 系统要求

### 必需软件

- **Claude Code**: 最新版本
- **Node.js**: 16.x 或更高版本
- **Python**: 3.8 或更高版本
- **操作系统**: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)

### Python 依赖包

```bash
pip install pyyaml networkx markdown
```

### 项目要求

- 项目根目录必须存在 `.agent/` 目录
- `.agent/` 目录结构应包含：
  - `memory/` - 决策记录
  - `knowledge/` - 知识图谱
  - `scripts/` - Python 脚本
  - `adapters/` - 适配器
  - `guards/` - 质量门

## 快速安装

### 方法 1：使用安装脚本（推荐）

```bash
# 1. 进入插件目录
cd .omc/axiom-omc-integration

# 2. 运行安装脚本
node scripts/install.js

# 3. 重启 Claude Code
```

安装脚本会自动：
- 检查 Python 环境
- 创建插件目录
- 复制所有必需文件
- 创建符号链接到项目 `.agent/` 目录
- 验证安装

## 手动安装

如果自动安装失败，可以手动安装：

### 步骤 1：创建插件目录

```bash
# Linux/macOS
mkdir -p ~/.claude/plugins/axiom-omc-integration

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.claude\plugins\axiom-omc-integration"
```

### 步骤 2：复制插件文件

```bash
# 复制所有文件到插件目录
cp -r .omc/axiom-omc-integration/* ~/.claude/plugins/axiom-omc-integration/
```

### 步骤 3：创建符号链接

```bash
# Linux/macOS
ln -s $(pwd)/.agent ~/.claude/plugins/axiom-omc-integration/.agent-link

# Windows (需要管理员权限)
mklink /D "%USERPROFILE%\.claude\plugins\axiom-omc-integration\.agent-link" "%CD%\.agent"
```

## 配置

### 基础配置

插件配置文件位于 `~/.claude/plugins/axiom-omc-integration/config/`

#### 1. 集成配置 (`integration.yaml`)

```yaml
# 命令路由配置
command_routing:
  omc_priority:
    - /autopilot
    - /ralph
    - /team
    - /ultrawork

  axiom_priority:
    - /start
    - /prd
    - /analyze-error
    - /evolve
    - /reflect
    - /patterns
    - /knowledge

# 冲突解决策略
conflict_resolution:
  strategy: omc_priority

# 状态同步配置
state_sync:
  auto_sync: true
  sync_interval: 300
  sync_direction: bidirectional
```

## 验证安装

### 1. 检查插件加载

重启 Claude Code 后，运行：

```
/help
```

应该看到 Axiom + OMC Integration 插件的命令列表。

### 2. 测试基础功能

```
/axiom-omc:start
```

应该看到系统启动信息和上下文加载状态。

## 故障排查

### 问题 1：插件未加载

**症状**：重启 Claude Code 后，`/help` 中没有看到插件命令

**解决方案**：
1. 检查插件目录是否正确
2. 检查 `plugin.json` 格式是否正确
3. 查看 Claude Code 日志

### 问题 2：Python 脚本执行失败

**症状**：运行技能时报错 "Python 脚本执行失败"

**解决方案**：
1. 检查 Python 是否在 PATH 中
2. 检查必需的 Python 包
3. 安装缺失的包：`pip install pyyaml networkx markdown`

## 卸载

### 使用卸载脚本（推荐）

```bash
cd .omc/axiom-omc-integration
node scripts/uninstall.js
```

## 获取帮助

### 文档资源

- **用户指南**: `docs/USER_GUIDE.md`
- **API 参考**: `docs/API_REFERENCE.md`
- **开发指南**: `docs/DEVELOPMENT.md`
- **更新日志**: `CHANGELOG.md`

## 下一步

安装完成后，建议：

1. 阅读用户指南了解基本用法
2. 查看示例学习常见场景
3. 配置集成设置以适应项目需求
4. 探索自定义技能扩展功能
