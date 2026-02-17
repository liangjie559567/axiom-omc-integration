---
name: team
description: 多代理协调工作流 - 使用 Task 工具调度多个专业代理协同完成复杂任务
---

# Team 多代理协调技能

## 概述

Team 技能实现多代理协调工作流，通过 5 个阶段（plan → prd → exec → verify → fix）组织多个专业代理协同工作。

## 核心特性

- **多阶段执行**：plan（规划）→ prd（需求文档）→ exec（执行）→ verify（验证）→ fix（修复）
- **智能代理调度**：根据任务类型自动选择合适的代理（analyst、planner、executor、verifier 等）
- **状态持久化**：使用 OMC state 工具保存和恢复工作流状态
- **并行执行**：exec 阶段支持多个 executor 并行工作
- **自动修复循环**：verify 失败时自动进入 fix 循环（最多 3 次）

## 工作流阶段

### 阶段 1: team-plan（规划阶段）

**目标**：分析任务、探索代码库、制定执行计划

**调度代理**：
- `oh-my-claudecode:explore` (model: haiku) - 快速代码库探索
- `oh-my-claudecode:planner` (model: opus) - 制定详细计划

**输入**：用户任务描述
**输出**：任务分解、依赖关系、执行顺序

### 阶段 2: team-prd（需求文档阶段）

**目标**：明确验收标准、定义接口契约、识别风险

**调度代理**：
- `oh-my-claudecode:analyst` (model: opus) - 需求分析

**输入**：team-plan 的输出
**输出**：详细的需求文档（PRD）、验收标准

### 阶段 3: team-exec（执行阶段）

**目标**：并行执行实现任务

**调度代理**：
- `oh-my-claudecode:executor` (model: sonnet) - 主要实现代理
- `oh-my-claudecode:designer` (model: sonnet) - UI/UX 相关任务
- `oh-my-claudecode:test-engineer` (model: sonnet) - 测试编写
- `oh-my-claudecode:build-fixer` (model: sonnet) - 构建/类型错误修复

**输入**：team-prd 的输出
**输出**：实现的代码、测试、文档

### 阶段 4: team-verify（验证阶段）

**目标**：验证实现是否满足需求和质量标准

**调度代理**：
- `oh-my-claudecode:verifier` (model: sonnet) - 主验证代理
- `oh-my-claudecode:security-reviewer` (model: sonnet) - 安全审查
- `oh-my-claudecode:code-reviewer` (model: opus) - 代码审查

**输入**：team-exec 的输出
**输出**：验证报告、发现的问题列表

### 阶段 5: team-fix（修复阶段）

**目标**：修复验证阶段发现的问题

**调度代理**：
- `oh-my-claudecode:executor` (model: sonnet) - 修复实现问题
- `oh-my-claudecode:debugger` (model: sonnet) - 调试复杂问题
- `oh-my-claudecode:build-fixer` (model: sonnet) - 修复构建问题

**输入**：team-verify 的问题列表
**输出**：修复后的代码

**循环控制**：最多 3 次修复尝试，超过则标记为 failed

## 状态管理

使用 OMC state 工具进行状态持久化：

```javascript
// 状态结构
{
  mode: "team",
  active: true,
  current_phase: "team-plan" | "team-prd" | "team-exec" | "team-verify" | "team-fix" | "complete" | "failed",
  task_description: "原始任务描述",
  fix_loop_count: 0,
  max_fix_attempts: 3,
  stage_history: [
    { stage: "team-plan", status: "completed", timestamp: "..." },
    // ...
  ],
  plan_output: "...",
  prd_output: "...",
  exec_output: "...",
  verify_output: "...",
  linked_ralph: null  // 如果与 ralph 联动
}
```

## 使用方法

### 基本用法

```
/oh-my-claudecode:team "实现用户认证功能"
```

### 与 ralph 联动（持久化循环）

```
/oh-my-claudecode:team ralph "重构整个架构"
```

## 实现细节

### 阶段转换逻辑

```
team-plan → team-prd: 规划完成
team-prd → team-exec: PRD 完成
team-exec → team-verify: 所有执行任务完成
team-verify → team-fix | complete | failed: 根据验证结果决定
team-fix → team-exec | team-verify | complete | failed: 根据修复结果决定
```

### 核心实现代码

**步骤 1: 初始化状态**

```javascript
// 读取现有状态或创建新状态
const state = await state_read({ mode: "team" }) || {
  mode: "team",
  active: true,
  current_phase: "team-plan",
  task_description: args,
  fix_loop_count: 0,
  max_fix_attempts: 3,
  stage_history: []
};
```

**步骤 2: 执行当前阶段**

根据 `current_phase` 调用对应的 Task 代理：

```javascript
switch (state.current_phase) {
  case "team-plan":
    // 并行调用 explore 和 planner
    const exploreTask = Task({
      subagent_type: "oh-my-claudecode:explore",
      model: "haiku",
      prompt: `探索代码库，为以下任务收集上下文：${state.task_description}`
    });

    const planTask = Task({
      subagent_type: "oh-my-claudecode:planner",
      model: "opus",
      prompt: `基于任务制定详细计划：${state.task_description}\n\n代码库上下文：${exploreTask.output}`
    });

    state.plan_output = planTask.output;
    state.current_phase = "team-prd";
    break;

  case "team-prd":
    const prdTask = Task({
      subagent_type: "oh-my-claudecode:analyst",
      model: "opus",
      prompt: `基于计划编写 PRD：${state.plan_output}`
    });

    state.prd_output = prdTask.output;
    state.current_phase = "team-exec";
    break;

  case "team-exec":
    // 根据任务类型并行调度多个 executor
    const execTasks = [
      Task({
        subagent_type: "oh-my-claudecode:executor",
        model: "sonnet",
        prompt: `实现功能：${state.prd_output}`
      })
    ];

    state.exec_output = execTasks.map(t => t.output).join("\n");
    state.current_phase = "team-verify";
    break;

  case "team-verify":
    const verifyTask = Task({
      subagent_type: "oh-my-claudecode:verifier",
      model: "sonnet",
      prompt: `验证实现：${state.exec_output}\n\nPRD：${state.prd_output}`
    });

    state.verify_output = verifyTask.output;

    // 根据验证结果决定下一步
    if (verifyTask.output.includes("通过")) {
      state.current_phase = "complete";
    } else if (state.fix_loop_count >= state.max_fix_attempts) {
      state.current_phase = "failed";
    } else {
      state.current_phase = "team-fix";
      state.fix_loop_count++;
    }
    break;

  case "team-fix":
    const fixTask = Task({
      subagent_type: "oh-my-claudecode:executor",
      model: "sonnet",
      prompt: `修复问题：${state.verify_output}`
    });

    state.exec_output = fixTask.output;
    state.current_phase = "team-verify";
    break;
}
```

**步骤 3: 保存状态**

```javascript
await state_write({
  mode: "team",
  state: state
});
```

**步骤 4: 记录到 operations-log**

```javascript
await notepad_write_working(`
## Team 工作流执行
时间：${new Date().toISOString()}
阶段：${state.current_phase}
状态：${state.active ? "进行中" : "已完成"}
`);
```

## 错误处理

- Task 调用失败：记录错误，标记为 failed
- 状态读写失败：使用默认状态继续
- 超过最大修复次数：标记为 failed，输出详细报告

## 取消机制

使用 `/oh-my-claudecode:cancel` 取消 team 工作流：

```javascript
// 标记状态为非活跃
state.active = false;
state.current_phase = "cancelled";
await state_write({ mode: "team", state: state });
```

## 与其他技能集成

- **ralph**: 提供持久化循环包装
- **ultrawork**: 在 exec 阶段提供最大并行度
- **autopilot**: 可作为 team 的简化版本

## 参考配置

参考 `workflows/team.yaml` 获取完整的代理定义和协作协议。

---

## 执行指令（系统内部）

当用户调用 `/oh-my-claudecode:team "任务描述"` 时，必须按以下流程执行：

### 步骤 1: 读取或初始化状态

```
调用 state_read(mode="team")
如果状态不存在或 active=false，创建新状态：
  - mode: "team"
  - active: true
  - current_phase: "team-plan"
  - task_description: [用户输入]
  - fix_loop_count: 0
  - max_fix_attempts: 3
  - stage_history: []
```

### 步骤 2: 执行当前阶段

根据 `current_phase` 执行对应逻辑：

**如果 current_phase = "team-plan"：**

1. 输出：`🔍 阶段 1/5: 规划阶段 - 分析任务并制定计划`
2. 并行调用两个代理：
   - Task(subagent_type="oh-my-claudecode:explore", model="haiku", prompt="探索代码库，为以下任务收集上下文：[task_description]")
   - Task(subagent_type="oh-my-claudecode:planner", model="opus", prompt="基于任务制定详细计划：[task_description]\n\n代码库上下文：[explore输出]")
3. 保存 plan_output = planner 的输出
4. 更新 current_phase = "team-prd"
5. 记录到 stage_history

**如果 current_phase = "team-prd"：**

1. 输出：`📋 阶段 2/5: PRD 阶段 - 编写需求文档`
2. 调用：Task(subagent_type="oh-my-claudecode:analyst", model="opus", prompt="基于计划编写详细 PRD：[plan_output]")
3. 保存 prd_output = analyst 的输出
4. 更新 current_phase = "team-exec"
5. 记录到 stage_history

**如果 current_phase = "team-exec"：**

1. 输出：`⚙️ 阶段 3/5: 执行阶段 - 实现功能`
2. 调用：Task(subagent_type="oh-my-claudecode:executor", model="sonnet", prompt="实现以下 PRD：[prd_output]")
3. 保存 exec_output = executor 的输出
4. 更新 current_phase = "team-verify"
5. 记录到 stage_history

**如果 current_phase = "team-verify"：**

1. 输出：`✅ 阶段 4/5: 验证阶段 - 检查实现质量`
2. 调用：Task(subagent_type="oh-my-claudecode:verifier", model="sonnet", prompt="验证实现是否满足 PRD：\n\nPRD：[prd_output]\n\n实现：[exec_output]")
3. 保存 verify_output = verifier 的输出
4. 分析验证结果：
   - 如果包含"通过"或"PASS"：current_phase = "complete"
   - 如果 fix_loop_count >= max_fix_attempts：current_phase = "failed"
   - 否则：current_phase = "team-fix"，fix_loop_count++
5. 记录到 stage_history

**如果 current_phase = "team-fix"：**

1. 输出：`🔧 阶段 5/5: 修复阶段 - 修复发现的问题（第 [fix_loop_count]/3 次）`
2. 调用：Task(subagent_type="oh-my-claudecode:executor", model="sonnet", prompt="修复以下问题：[verify_output]")
3. 更新 exec_output = executor 的输出
4. 更新 current_phase = "team-verify"
5. 记录到 stage_history

**如果 current_phase = "complete"：**

1. 输出：`🎉 Team 工作流完成！`
2. 更新 active = false
3. 输出最终报告

**如果 current_phase = "failed"：**

1. 输出：`❌ Team 工作流失败（超过最大修复次数）`
2. 更新 active = false
3. 输出失败报告和建议

### 步骤 3: 保存状态

```
调用 state_write(mode="team", state=[更新后的状态])
```

### 步骤 4: 决定是否继续

- 如果 current_phase 不是 "complete" 或 "failed"，返回步骤 2
- 否则，结束工作流

---

## 状态恢复机制

当检测到已存在的 team 状态（active=true）时：

1. 读取状态：`state_read(mode="team")`
2. 输出：`🔄 检测到未完成的 team 工作流，从 [current_phase] 阶段恢复`
3. 显示历史记录：遍历 stage_history 显示已完成的阶段
4. 继续执行当前阶段

## 取消机制实现

当用户调用 `/oh-my-claudecode:cancel` 时：

1. 读取状态：`state_read(mode="team")`
2. 如果状态存在且 active=true：
   - 更新 active = false
   - 更新 current_phase = "cancelled"
   - 记录取消时间到 stage_history
   - 保存状态：`state_write(mode="team", state=[更新后的状态])`
   - 输出：`🛑 Team 工作流已取消`
3. 如果同时存在 linked_ralph，也取消 ralph 状态

## 与 Ralph 联动

当用户调用 `/oh-my-claudecode:team ralph "任务"` 时：

1. 创建 team 状态，设置 linked_ralph = true
2. 创建 ralph 状态，设置 linked_team = true
3. Ralph 提供持久化循环，Team 提供多代理协调
4. 取消任一模式时，同时取消另一模式

---

## 示例输出

### 成功场景

```
🔍 阶段 1/5: 规划阶段 - 分析任务并制定计划
[explore 和 planner 的输出]

📋 阶段 2/5: PRD 阶段 - 编写需求文档
[analyst 的输出]

⚙️ 阶段 3/5: 执行阶段 - 实现功能
[executor 的输出]

✅ 阶段 4/5: 验证阶段 - 检查实现质量
[verifier 的输出]

🎉 Team 工作流完成！

## 最终报告
- 总耗时：45 分钟
- 完成阶段：plan → prd → exec → verify
- 修复次数：0
- 状态：成功
```

### 需要修复场景

```
✅ 阶段 4/5: 验证阶段 - 检查实现质量
发现 3 个问题需要修复

🔧 阶段 5/5: 修复阶段 - 修复发现的问题（第 1/3 次）
[executor 的修复输出]

✅ 阶段 4/5: 验证阶段 - 检查实现质量（重新验证）
[verifier 的输出]

🎉 Team 工作流完成！
```

### 失败场景

```
🔧 阶段 5/5: 修复阶段 - 修复发现的问题（第 3/3 次）
[executor 的修复输出]

✅ 阶段 4/5: 验证阶段 - 检查实现质量（重新验证）
仍有问题未解决

❌ Team 工作流失败（超过最大修复次数）

## 失败报告
- 总耗时：90 分钟
- 完成阶段：plan → prd → exec → verify → fix (x3)
- 修复次数：3/3
- 状态：失败
- 建议：手动介入或简化任务范围
```

---

## 使用示例

### 示例 1: 实现用户认证

```
用户: /oh-my-claudecode:team "实现 JWT 用户认证功能"

系统:
🔍 阶段 1/5: 规划阶段 - 分析任务并制定计划
[explore 探索现有代码结构]
[planner 制定实现计划：数据模型 → API 端点 → 中间件 → 测试]

📋 阶段 2/5: PRD 阶段 - 编写需求文档
[analyst 输出详细 PRD，包含验收标准]

⚙️ 阶段 3/5: 执行阶段 - 实现功能
[executor 实现代码]

✅ 阶段 4/5: 验证阶段 - 检查实现质量
[verifier 验证通过]

🎉 Team 工作流完成！
```

### 示例 2: 重构复杂模块（使用 ralph 持久化）

```
用户: /oh-my-claudecode:team ralph "重构支付模块"

系统:
🔄 启动 Team + Ralph 联动模式
[Team 提供多代理协调，Ralph 提供持久化循环]

🔍 阶段 1/5: 规划阶段...
[完整执行流程]
```

### 示例 3: 恢复中断的工作流

```
用户: /oh-my-claudecode:team "继续之前的任务"

系统:
🔄 检测到未完成的 team 工作流，从 team-exec 阶段恢复

已完成阶段：
✅ team-plan (2026-02-18 10:30)
✅ team-prd (2026-02-18 10:45)

⚙️ 阶段 3/5: 执行阶段 - 实现功能
[继续执行]
```

---

## 最佳实践

1. **任务描述要清晰**：提供足够的上下文和约束条件
2. **适合复杂任务**：team 适合需要多步骤协调的复杂任务
3. **监控修复循环**：如果修复次数接近上限，考虑简化任务
4. **使用 ralph 联动**：对于长时间任务，使用 ralph 提供持久化保障
5. **及时取消**：如果发现方向错误，及时使用 `/cancel` 取消

---

## 故障排查

### 问题：Team 工作流无响应

**原因**：状态文件损坏或 Task 工具不可用
**解决**：
1. 检查 `.omc/state/team-state.json` 是否存在
2. 使用 `/oh-my-claudecode:cancel --force` 清除状态
3. 重新启动工作流

### 问题：验证阶段一直失败

**原因**：PRD 标准过高或实现有根本性问题
**解决**：
1. 查看 verify_output 了解具体问题
2. 如果是标准问题，手动调整 PRD
3. 如果是实现问题，考虑简化任务范围

### 问题：修复循环超过上限

**原因**：任务过于复杂或存在架构级问题
**解决**：
1. 分析失败报告中的问题模式
2. 将任务拆分为更小的子任务
3. 或手动介入修复关键问题后继续

