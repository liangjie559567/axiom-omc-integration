---
name: autopilot
description: 全自动执行工作流 - 从想法到代码的完整自动化实现
---

# Autopilot 全自动执行技能

## 概述

Autopilot 实现从想法到代码的全自动执行，自动完成需求澄清、规划、实现、测试和验证的完整流程。

## 核心特性

- **全自动执行**：无需人工干预，自动完成所有阶段
- **智能决策**：根据任务复杂度自动选择执行策略
- **质量保证**：自动运行测试和验证
- **状态持久化**：支持中断恢复

## 执行流程

1. **需求澄清**：调用 brainstorming 分析需求
2. **制定计划**：调用 writing-plans 制定实现计划
3. **执行实现**：调用 executor 实现代码
4. **运行测试**：自动运行测试验证
5. **质量验证**：调用 verifier 验证完成度

## 使用方法

```
/oh-my-claudecode:autopilot "实现用户登录功能"
```

## 状态管理

使用 OMC state 工具管理执行状态：

```javascript
{
  mode: "autopilot",
  active: true,
  current_stage: "clarify" | "plan" | "exec" | "test" | "verify" | "complete",
  task_description: "...",
  outputs: {
    clarify: "...",
    plan: "...",
    exec: "...",
    test: "...",
    verify: "..."
  }
}
```

## 执行指令

当用户调用 `/oh-my-claudecode:autopilot "任务"` 时：

### 步骤 1: 初始化
- 读取或创建 autopilot 状态
- 设置 current_stage = "clarify"

### 步骤 2: 需求澄清
- 调用 Task(subagent_type="oh-my-claudecode:analyst", model="opus")
- 保存输出到 outputs.clarify
- 更新 current_stage = "plan"

### 步骤 3: 制定计划
- 调用 Task(subagent_type="oh-my-claudecode:planner", model="opus")
- 保存输出到 outputs.plan
- 更新 current_stage = "exec"

### 步骤 4: 执行实现
- 调用 Task(subagent_type="oh-my-claudecode:executor", model="sonnet")
- 保存输出到 outputs.exec
- 更新 current_stage = "test"

### 步骤 5: 运行测试
- 调用 Task(subagent_type="oh-my-claudecode:test-engineer", model="sonnet")
- 保存输出到 outputs.test
- 更新 current_stage = "verify"

### 步骤 6: 质量验证
- 调用 Task(subagent_type="oh-my-claudecode:verifier", model="sonnet")
- 如果通过：current_stage = "complete"
- 如果失败：返回 exec 阶段修复

### 步骤 7: 保存状态
- 调用 state_write(mode="autopilot", state=...)

