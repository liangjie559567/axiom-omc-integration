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

当用户调用 `/oh-my-claudecode:autopilot "任务"` 时，按以下步骤自动执行：

### 步骤 1: 状态初始化
```javascript
// 读取现有状态或创建新状态
const state = state_read(mode="autopilot") || {
  mode: "autopilot",
  active: true,
  current_stage: "clarify",
  task_description: "用户任务描述",
  outputs: {}
};
```

### 步骤 2: 需求澄清阶段
```javascript
if (state.current_stage === "clarify") {
  // 调用 analyst 代理进行需求分析
  const clarifyResult = Task({
    subagent_type: "oh-my-claudecode:analyst",
    model: "opus",
    prompt: `分析以下任务需求：${state.task_description}

    输出要求：
    1. 核心需求描述
    2. 功能范围界定
    3. 验收标准定义
    4. 技术约束识别`
  });

  state.outputs.clarify = clarifyResult;
  state.current_stage = "plan";
  state_write(mode="autopilot", state);
}
```

### 步骤 3: 制定计划阶段
```javascript
if (state.current_stage === "plan") {
  // 调用 planner 代理制定实现计划
  const planResult = Task({
    subagent_type: "oh-my-claudecode:planner",
    model: "opus",
    prompt: `基于需求澄清结果制定实现计划：

    需求：${state.outputs.clarify}

    输出要求：
    1. 技术设计方案
    2. 任务分解清单
    3. 依赖关系图
    4. 风险识别与缓解`
  });

  state.outputs.plan = planResult;
  state.current_stage = "exec";
  state_write(mode="autopilot", state);
}
```

### 步骤 4: 执行实现阶段
```javascript
if (state.current_stage === "exec") {
  // 调用 executor 代理执行实现
  const execResult = Task({
    subagent_type: "oh-my-claudecode:executor",
    model: "sonnet",
    prompt: `按照计划执行实现：

    计划：${state.outputs.plan}

    执行要求：
    1. 严格遵循计划
    2. 保持代码质量
    3. 编写必要注释
    4. 实时记录进度`
  });

  state.outputs.exec = execResult;
  state.current_stage = "test";
  state_write(mode="autopilot", state);
}
```

### 步骤 5: 测试验证阶段
```javascript
if (state.current_stage === "test") {
  // 调用 test-engineer 代理运行测试
  const testResult = Task({
    subagent_type: "oh-my-claudecode:test-engineer",
    model: "sonnet",
    prompt: `运行测试验证实现：

    实现：${state.outputs.exec}

    测试要求：
    1. 单元测试覆盖
    2. 集成测试验证
    3. 边界条件测试
    4. 错误处理测试`
  });

  state.outputs.test = testResult;
  state.current_stage = "verify";
  state_write(mode="autopilot", state);
}
```

### 步骤 6: 质量验证阶段
```javascript
if (state.current_stage === "verify") {
  // 调用 verifier 代理验证完成度
  const verifyResult = Task({
    subagent_type: "oh-my-claudecode:verifier",
    model: "sonnet",
    prompt: `验证任务完成度：

    需求：${state.outputs.clarify}
    实现：${state.outputs.exec}
    测试：${state.outputs.test}

    验证要求：
    1. 需求覆盖完整性
    2. 代码质量评估
    3. 测试覆盖充分性
    4. 文档完整性检查`
  });

  if (verifyResult.passed) {
    state.current_stage = "complete";
    state.active = false;
  } else {
    // 验证失败，返回执行阶段修复
    state.current_stage = "exec";
    state.outputs.verify_feedback = verifyResult.feedback;
  }

  state_write(mode="autopilot", state);
}
```

### 步骤 7: 完成与清理
```javascript
if (state.current_stage === "complete") {
  // 输出完成报告
  console.log("✅ Autopilot 执行完成");
  console.log("需求澄清：", state.outputs.clarify);
  console.log("实现计划：", state.outputs.plan);
  console.log("执行结果：", state.outputs.exec);
  console.log("测试结果：", state.outputs.test);
  console.log("验证结果：", state.outputs.verify);

  // 保持状态以供审查
  state_write(mode="autopilot", state);
}
```

## 错误处理

如果任何阶段失败：
1. 记录错误信息到 state.error
2. 保存当前状态
3. 输出错误报告
4. 等待人工介入或自动重试

