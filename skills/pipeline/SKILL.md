---
name: pipeline
description: 顺序链式执行工作流 - 按顺序执行多个代理任务
---

# Pipeline 顺序链式技能

## 概述

Pipeline 实现顺序链式执行，每个阶段的输出作为下一阶段的输入。

## 核心特性

- **顺序执行**：严格按顺序执行
- **数据传递**：阶段间自动传递数据
- **可配置**：灵活定义执行链

## 使用方法

```
/oh-my-claudecode:pipeline "分析 → 设计 → 实现 → 测试"
```

## 执行逻辑

```
输入 → 代理1 → 输出1 → 代理2 → 输出2 → ... → 最终输出
```

## 状态结构

```javascript
{
  mode: "pipeline",
  active: true,
  stages: ["stage1", "stage2", ...],
  current_stage_index: 0,
  outputs: {}
}
```

