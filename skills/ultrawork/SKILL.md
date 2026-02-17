---
name: ultrawork
description: 最大并行执行工作流 - 通过并行代理最大化执行效率
---

# Ultrawork 最大并行技能

## 概述

Ultrawork 通过并行调度多个代理实现最大化执行效率。

## 核心特性

- **最大并行度**：同时运行多个独立任务
- **智能调度**：自动识别可并行任务
- **资源优化**：合理分配代理资源

## 使用方法

```
/oh-my-claudecode:ultrawork "实现多个独立功能"
```

## 执行逻辑

### 步骤 1: 任务分解
```javascript
const subtasks = Task({
  subagent_type: "oh-my-claudecode:planner",
  model: "haiku",
  prompt: `分解为独立并行子任务：${task_description}`
});
```

### 步骤 2: 并行执行
```javascript
const results = await Promise.all(
  subtasks.map(subtask =>
    Task({
      subagent_type: "oh-my-claudecode:executor",
      model: "sonnet",
      prompt: subtask,
      run_in_background: true
    })
  )
);
```

### 步骤 3: 结果整合
```javascript
const integrated = Task({
  subagent_type: "oh-my-claudecode:verifier",
  prompt: `整合并验证结果：${results}`
});
```

## 状态结构

```javascript
{
  mode: "ultrawork",
  active: true,
  parallel_tasks: [],
  completed_tasks: []
}
```

