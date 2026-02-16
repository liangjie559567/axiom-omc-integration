# Axiom + OMC Integration 快速开始指南

## 欢迎使用 Axiom + OMC Integration！

本指南将帮助您在 5 分钟内开始使用 Axiom + OMC Integration 插件。

## 前提条件

在开始之前，请确保：

- ✅ 已安装 Claude Code
- ✅ 已安装 Python 3.8+
- ✅ 已完成插件安装（参见 [installation.md](installation.md)）

## 第一步：初始化系统

在项目根目录运行初始化命令：

```
/axiom-omc:start
```

这将：
1. 创建必要的目录结构（`.agent/`, `.omc/`）
2. 初始化记忆管理器
3. 加载知识图谱
4. 生成系统状态报告

**预期输出**：

```
🚀 启动 Axiom + OMC 整合系统...

📊 系统状态报告
================================================================================

✅ 组件状态
  - 记忆管理器: 已加载
  - 知识图谱: 已加载 (234 个节点)
  - 命令路由器: 已初始化
  - 状态同步: 已启用

📈 统计信息
  - 决策记录: 42 条
  - 代码模式: 28 个
  - 知识节点: 234 个

✅ 系统启动完成！
```

## 第二步：生成 PRD（产品需求文档）

使用 `/axiom-omc:prd` 技能生成高质量的 PRD：

```
/axiom-omc:prd "实现用户认证功能"
```

**预期输出**：

```
📝 生成 PRD: 实现用户认证功能

✅ PRD 生成完成

📄 PRD 内容
================================================================================

## 功能概述
实现基于 JWT 的用户认证系统，支持登录、注册、token 刷新功能。

## 核心需求
1. 用户注册
   - 邮箱验证
   - 密码强度检查
   - 用户信息存储

2. 用户登录
   - JWT token 生成
   - 登录失败限制
   - 记住我功能

3. Token 管理
   - Access Token (15分钟)
   - Refresh Token (7天)
   - Token 刷新机制

## 验收标准
- [ ] 用户可以成功注册
- [ ] 用户可以使用邮箱和密码登录
- [ ] Token 过期后可以刷新
- [ ] 登录失败5次后锁定15分钟

✅ PRD 已保存到: .agent/memory/prd_20260216_001.md
✅ 决策已记录到知识图谱
```

## 第三步：分析错误

当遇到错误时，使用 `/axiom-omc:analyze-error` 技能：

```
/axiom-omc:analyze-error "ImportError: cannot import name 'User' from 'app.models'"
```

**预期输出**：

```
🔍 分析错误: ImportError

✅ 错误分析完成

📊 分析结果
================================================================================

错误类型: ImportError
严重程度: 高
影响范围: 模块导入

🔍 根本原因
  - 循环导入依赖
  - 模块路径错误
  - 模块未正确初始化

💡 解决方案
1. 检查 app/models/__init__.py 是否正确导出 User
2. 确认导入路径是否正确
3. 检查是否存在循环导入

📚 相关知识
  - 决策 #15: Python 模块导入最佳实践
  - 模式 #8: 避免循环导入的设计模式

✅ 分析报告已保存到: .agent/logs/error_analysis_20260216_001.md
```

## 第四步：触发知识进化

定期运行 `/axiom-omc:evolve` 更新知识图谱：

```
/axiom-omc:evolve
```

**预期输出**：

```
🧠 触发知识进化...

✅ 知识进化完成

📊 进化结果
================================================================================

📚 决策学习
  - 新增决策: 3 条
  - 更新决策: 5 条
  - 提取洞察: 8 条

🔍 模式提取
  - 新增模式: 2 个
  - 更新模式: 4 个

🌐 知识图谱更新
  - 新增节点: 15 个
  - 新增边: 23 条
  - 总节点数: 249 个

✅ 知识图谱已更新: .agent/knowledge/knowledge_graph.json
```

## 第五步：生成反思报告

使用 `/axiom-omc:reflect` 分析决策质量：

```
/axiom-omc:reflect
```

**预期输出**：

```
🤔 生成反思报告...

✅ 反思报告生成完成

📊 决策质量分析
================================================================================

📈 决策统计
  - 总决策数: 42
  - 成功决策: 35 (83.3%)
  - 失败决策: 7 (16.7%)

🔍 问题模式识别
1. 过早优化 (3 次)
   - 在需求不明确时进行性能优化
   - 建议: 先实现功能，再优化性能

2. 技术选型不当 (2 次)
   - 选择了不适合项目规模的技术
   - 建议: 评估技术复杂度和团队能力

💡 改进建议
1. 加强需求分析阶段
2. 建立技术选型评估标准
3. 定期进行代码审查

✅ 反思报告已保存到: .agent/reports/reflection_20260216_001.md
```

## 常用技能速查

### 1. 查看代码模式

```
/axiom-omc:patterns
```

查看项目中识别的设计模式、架构模式和最佳实践。

### 2. 查询知识库

```
/axiom-omc:knowledge "认证"
```

搜索知识图谱中与"认证"相关的决策、模式和洞察。

### 3. 查看知识图谱统计

```
/axiom-omc:knowledge --stats
```

查看知识图谱的整体统计信息。

### 4. 按类型过滤模式

```
/axiom-omc:patterns --type design_pattern
```

只显示设计模式相关的模式。

### 5. 查看相关知识节点

```
/axiom-omc:knowledge --related decision_20260115_001
```

查看与特定决策相关的所有知识节点。

## 工作流程示例

### 场景 1：开发新功能

```bash
# 1. 生成 PRD
/axiom-omc:prd "实现用户认证功能"

# 2. 查询相关知识
/axiom-omc:knowledge "认证"

# 3. 查看相关模式
/axiom-omc:patterns --search "认证"

# 4. 开始开发...

# 5. 遇到错误时分析
/axiom-omc:analyze-error "错误信息"

# 6. 完成后触发知识进化
/axiom-omc:evolve

# 7. 生成反思报告
/axiom-omc:reflect
```

### 场景 2：代码审查

```bash
# 1. 查看项目模式
/axiom-omc:patterns

# 2. 查询相关决策
/axiom-omc:knowledge --type decision

# 3. 生成反思报告
/axiom-omc:reflect

# 4. 更新知识图谱
/axiom-omc:evolve
```

### 场景 3：技术选型

```bash
# 1. 查询历史决策
/axiom-omc:knowledge "数据库"

# 2. 查看相关模式
/axiom-omc:patterns --search "数据库"

# 3. 生成 PRD
/axiom-omc:prd "选择合适的数据库方案"

# 4. 记录决策
# (在开发过程中自动记录)

# 5. 触发知识进化
/axiom-omc:evolve
```

## 配置建议

### 自动同步

编辑 `.agent/config/integration.yaml` 启用自动同步：

```yaml
state_sync:
  auto_sync: true
  sync_interval: 300  # 每5分钟同步一次
  direction: bidirectional
```

### 质量门检查

编辑 `.agent/config/quality_gates.yaml` 配置质量标准：

```yaml
prd_gate:
  require_confirmation: true
  min_score: 80

commit_gate:
  check_test_coverage: true
  min_coverage: 80
```

## 下一步

现在您已经掌握了基础用法，建议：

1. 阅读 [技能使用指南](skills-guide.md) 了解每个技能的详细用法
2. 阅读 [工作流程指南](workflows-guide.md) 学习高级工作流程
3. 阅读 [最佳实践](best-practices.md) 了解使用建议

## 获取帮助

如果遇到问题：

1. 查看 [故障排查指南](installation.md#故障排查)
2. 检查操作日志：`.claude/operations-log.md`
3. 查看系统状态：`/axiom-omc:start --check`

祝您使用愉快！🎉
