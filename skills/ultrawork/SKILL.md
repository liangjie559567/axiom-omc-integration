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

1. 分析任务，识别独立子任务
2. 并行调用多个 Task 代理
3. 收集所有结果
4. 整合输出

## 状态结构

```javascript
{
  mode: "ultrawork",
  active: true,
  parallel_tasks: [],
  completed_tasks: []
}
```

