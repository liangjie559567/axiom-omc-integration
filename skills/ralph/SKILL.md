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

### 步骤 1: 初始化
- 读取或创建状态
- 设置 iteration = 0

### 步骤 2: 执行循环
- 调用 ultrawork 或 team 执行任务
- iteration++
- 验证结果

### 步骤 3: 判断继续
- 如果成功：标记 complete
- 如果失败且 iteration < max：继续循环
- 如果超过 max：标记 failed

