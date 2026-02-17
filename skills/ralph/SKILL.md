---
name: ralph
description: 持久化循环工作流 - 不停止直到任务完成
---

# Ralph 持久化循环技能

## 概述

Ralph 提供持久化循环执行，确保任务不会因中断而失败，持续执行直到完成。

## 核心特性

- **持久化循环**：自动重试和恢复
- **包含 ultrawork**：内置最大并行执行
- **永不放弃**：持续执行直到成功
- **状态保存**：每次迭代保存状态

## 执行逻辑

```
while (未完成) {
  1. 执行当前任务
  2. 验证结果
  3. 如果失败，分析原因并重试
  4. 保存状态
}
```

## 使用方法

```
/oh-my-claudecode:ralph "重构整个架构"
```

## 状态结构

```javascript
{
  mode: "ralph",
  active: true,
  iteration: 0,
  max_iterations: 10,
  task_description: "...",
  linked_team: null
}
```

## 执行指令

当用户调用 `/oh-my-claudecode:ralph "任务"` 时：

### 核心循环逻辑
```javascript
while (state.active && state.iteration < state.max_iterations) {
  // 1. 执行任务（使用 ultrawork 或 team）
  const result = Task({
    subagent_type: state.linked_team ? "oh-my-claudecode:team" : "oh-my-claudecode:ultrawork",
    prompt: state.task_description
  });

  // 2. 验证结果
  const verified = Task({
    subagent_type: "oh-my-claudecode:verifier",
    prompt: `验证任务完成度：${result}`
  });

  // 3. 更新状态
  state.iteration++;
  state.last_result = result;

  if (verified.passed) {
    state.active = false;
    state.status = "complete";
  } else if (state.iteration >= state.max_iterations) {
    state.active = false;
    state.status = "failed";
  }

  state_write(mode="ralph", state);
}
```

### 与 Team 联动
```javascript
// 如果用户调用 /ralph team "任务"
state.linked_team = true;
state.linked_team_name = "ralph-team-" + timestamp;
```

