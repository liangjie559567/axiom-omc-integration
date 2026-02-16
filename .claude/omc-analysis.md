# OMC 项目深度分析报告

**生成时间**: 2026-02-17
**分析范围**: Agent 系统、状态管理、Team Pipeline、模型路由

---

## 📊 项目概况

**项目名称**: Axiom-OMC-Superpowers Integration
**版本**: 1.0.0
**目标**: 统一的智能开发工作流平台

---

## 🤖 Agent 系统架构

### 当前实现的 Agent（5个核心Agent）

| Agent名称 | 模型 | 职责描述 | 能力 | 优先级 |
|---------|------|--------|------|-------|
| **executor** | Sonnet | 代码实现、重构、功能开发 | code_implementation, refactoring | High |
| **planner** | Opus | 任务规划、执行计划、风险标记 | task_planning, risk_assessment | High |
| **verifier** | Sonnet | 完成验证、测试充分性检查 | verification, testing | High |
| **debugger** | Sonnet | 根因分析、问题诊断 | debugging, root_cause_analysis | Medium |
| **code-reviewer** | Opus | 全面代码审查、架构评估 | code_review, architecture_review | Medium |

### OMC 完整 Agent 目录（32个）

#### Build/Analysis Lane（8个）
1. `explore` (Haiku) - 代码库发现、符号/文件映射
2. `analyst` (Opus) - 需求澄清、接受标准
3. `planner` (Opus) - 任务序列、执行计划
4. `architect` (Opus) - 系统设计、边界、接口
5. `debugger` (Sonnet) - 根因分析、回归隔离
6. `executor` (Sonnet) - 代码实现、重构
7. `deep-executor` (Opus) - 复杂自主任务
8. `verifier` (Sonnet) - 完成证据、声明验证

#### Review Lane（6个）
9. `style-reviewer` (Haiku) - 格式化、命名、lint
10. `quality-reviewer` (Sonnet) - 逻辑缺陷、可维护性
11. `api-reviewer` (Sonnet) - API契约、版本控制
12. `security-reviewer` (Sonnet) - 漏洞、信任边界
13. `performance-reviewer` (Sonnet) - 热点、复杂度优化
14. `code-reviewer` (Opus) - 综合审查

#### Domain Specialists（11个）
15. `dependency-expert` (Sonnet) - 外部SDK/API评估
16. `test-engineer` (Sonnet) - 测试策略、覆盖
17. `quality-strategist` (Sonnet) - 质量策略、发布准备
18. `build-fixer` (Sonnet) - 构建/工具链/类型失败
19. `designer` (Sonnet) - UX/UI架构、交互设计
20. `writer` (Haiku) - 文档、迁移说明
21. `qa-tester` (Sonnet) - 交互式CLI/服务验证
22. `scientist` (Sonnet) - 数据/统计分析
23. `document-specialist` (Sonnet) - 外部文档查询
24. `git-master` (Sonnet) - 提交策略、历史卫生
25. `researcher` (已弃用 → `document-specialist`)

#### Product Lane（4个）
26. `product-manager` (Sonnet) - 问题框架、PRD
27. `ux-researcher` (Sonnet) - 启发式审计、可用性
28. `information-architect` (Sonnet) - 分类、导航
29. `product-analyst` (Sonnet) - 产品指标、漏斗分析

#### Coordination（3个）
30. `critic` (Opus) - 计划/设计关键挑战
31. `vision` (Sonnet) - 图像/截图/图表分析

**总计**: 32个专业化Agent

---

## 🔄 状态管理机制

### 当前实现（src/state/index.js）

```javascript
export class StateManager extends EventEmitter {
  constructor() {
    super();
    this.state = {};        // 当前状态存储
    this.history = [];      // 状态变更历史
  }

  setState(key, value)      // 设置状态并记录历史
  getState(key)             // 获取单个状态
  getAllState()             // 获取所有状态
  getHistory(key = null)    // 获取状态变更历史
  reset()                   // 重置状态
}
```

**特点**:
- 基于EventEmitter的事件驱动架构
- 完整的状态变更历史追踪
- 支持选择性状态查询

### OMC 状态管理（.omc/state/）

```
{worktree}/.omc/state/
├── {mode}-state.json              # 模式状态文件
├── sessions/{sessionId}/          # 会话作用域状态
│   ├── autopilot-state.json
│   ├── team-state.json
│   ├── pipeline-state.json
│   └── ralph-state.json
└── logs/                          # 审计日志
```

**支持的模式**:
- `autopilot` - 完整自主执行
- `ultrapilot` - 最大并行化
- `team` - N个协调Agent
- `pipeline` - 顺序Agent链
- `ralph` - 自引用循环
- `ultrawork` - 最大并行化工作流

**状态字段**:
- `current_phase` - 当前执行阶段
- `team_name` - Team名称
- `fix_loop_count` - 修复循环计数
- `linked_ralph` / `linked_team` - 链接的其他模式
- `stage_history` - 阶段执行历史

---

## 🚀 Team Pipeline 实现

### Staged Pipeline 架构

```
team-plan → team-prd → team-exec → team-verify → team-fix (loop)
```

### 阶段定义与Agent路由

| 阶段 | 主要Agent | 职责 | 输出 |
|------|---------|------|------|
| **team-plan** | explore + planner | 代码库发现、任务分解 | 执行计划 |
| **team-prd** | analyst | 需求澄清、接受标准 | PRD文档 |
| **team-exec** | executor + 专家 | 代码实现、功能开发 | 实现代码 |
| **team-verify** | verifier + 审查员 | 功能验证、测试充分性 | 验证报告 |
| **team-fix** | executor/debugger | 缺陷修复、问题诊断 | 修复代码 |

### 阶段转移规则

```
team-plan → team-prd
  ↓
team-prd → team-exec
  ↓
team-exec → team-verify
  ↓
team-verify → {
  通过 → complete
  失败 → team-fix
  需讨论 → team-prd (回溯)
}
  ↓
team-fix → {
  修复成功 → team-verify (重新验证)
  修复失败 → team-exec (重新实现)
  超过最大尝试 → failed
}
```

### Team + Ralph 组合

当同时检测到 `team` 和 `ralph` 关键字时：
- Team提供多Agent协调
- Ralph提供持久化循环
- 两者共享链接状态
- 取消任一模式会同时取消两者

---

## 🎯 模型路由策略

### 模型分配原则

| 模型 | 用途 | Agent示例 | 特点 |
|------|------|---------|------|
| **Haiku** | 快速查询、轻量扫描 | explore, style-reviewer, writer | 快速、低成本 |
| **Sonnet** | 标准实现、调试、审查 | executor, verifier, debugger | 平衡性能和成本 |
| **Opus** | 架构、深度分析 | architect, planner, analyst | 高质量、高成本 |

### 模型选择示例

```javascript
// 快速查询
Task(subagent_type="oh-my-claudecode:explore", model="haiku")

// 标准实现
Task(subagent_type="oh-my-claudecode:executor", model="sonnet")

// 复杂架构
Task(subagent_type="oh-my-claudecode:architect", model="opus")
```

---

## 🔌 MCP 工具集成

### 可用的MCP提供商

| 提供商 | 模型 | 最佳用途 | 推荐角色 |
|-------|------|--------|--------|
| **Codex** | gpt-5.3-codex | 架构审查、计划验证 | architect, planner, critic |
| **Gemini** | gemini-3-pro | UI/UX设计、文档 | designer, writer, vision |

### MCP 工具调用

```javascript
// 使用Codex进行架构审查
mcp__x__ask_codex(
  agent_role="architect",
  prompt="Review this microservice architecture",
  context_files=[...]
)

// 使用Gemini进行设计审查
mcp__g__ask_gemini(
  agent_role="designer",
  prompt="Analyze this UI mockup",
  files=[...]
)
```

---

## 🛠️ 技能系统（Superpowers）

### 工作流技能
- `autopilot` - 完整自主执行
- `ralph` - 自引用循环
- `ultrawork` - 最大并行化
- `team` - N个协调Agent
- `pipeline` - 顺序Agent链
- `ultraqa` - QA循环
- `plan` - 战略规划

### Agent快捷方式
- `analyze` → debugger
- `deepsearch` → explore
- `tdd` → test-engineer
- `build-fix` → build-fixer
- `code-review` → code-reviewer

---

## 🔗 与Axiom/Superpowers的集成点

### 架构集成

```
Axiom (决策系统)
    ↓
OMC (多Agent协调)
    ↓
Superpowers (技能库)
    ↓
执行引擎 (并行/串行)
    ↓
记忆管理系统
    ↓
质量门系统
```

### 关键集成点

**1. 命令路由**
- 统一命令入口 (`CommandRouter`)
- 技能自动触发
- Agent自动选择

**2. 状态管理**
- 共享状态存储 (`StateManager`)
- 事件驱动同步
- 历史追踪

**3. 记忆系统**
- 对话历史管理
- 上下文存储
- 知识库检索

**4. 质量门禁**
- 三层验证机制
- 自动化测试
- 审查流程

---

## 📁 项目文件结构

```
axiom-omc-integration/
├── src/
│   ├── agents/          # Agent系统
│   ├── commands/        # 命令系统
│   ├── core/            # 核心模块
│   ├── memory/          # 记忆管理
│   ├── state/           # 状态管理
│   └── utils/           # 工具函数
├── config/
│   └── agents.json      # Agent配置
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── .claude/
    └── settings.local.json
```

---

## 🎯 关键发现与建议

### 当前状态

✅ **已实现**：
- 基础Agent系统框架
- 5个核心Agent定义
- 状态管理基础设施
- 命令路由系统

⚠️ **部分实现**：
- Team Pipeline框架（规范已定义）
- MCP工具集成（规范已定义）
- 技能系统（规范已定义）

❌ **待实现**：
- 完整的32个Agent实现
- 分布式执行引擎
- 向量化知识库
- 三层质量门禁

### 集成建议

**优先级1（关键）**：
1. 完成Team Pipeline的完整实现
2. 实现剩余27个Agent的定义和路由
3. 集成MCP工具（Codex和Gemini）

**优先级2（重要）**：
4. 实现分布式执行引擎
5. 完善状态管理（支持会话作用域）
6. 实现向量化知识库

**优先级3（增强）**：
7. 实现三层质量门禁
8. 自动化测试框架
9. 性能监测和优化

---

## 📝 总结

OMC 是一个高度模块化的多Agent协调系统，定义了32个专业化Agent，支持复杂的工作流编排。当前项目实现了基础框架，但完整的Agent系统、Team Pipeline和MCP集成仍需进一步开发。
