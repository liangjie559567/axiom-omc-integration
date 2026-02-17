---
name: systematic-debugging
description: 遇到任何 bug、测试失败或意外行为时使用，在提出修复方案之前必须先进行根因分析
---

# 系统化调试

## 铁律

**在提出任何修复方案之前，必须先完成根因调查。**

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

## 核心原则

调试不是猜测和尝试。这是一个系统化的调查过程：

- ✅ 先理解问题
- ✅ 找到根本原因
- ✅ 然后才修复
- ❌ 不要直接跳到修复

## 四阶段调试流程

### Phase 1: 根因调查（必须完成）

**在进入 Phase 2 之前，必须完成这个阶段。**

#### 1.1 复现问题

```bash
# 创建最小复现用例
test('复现 bug #123', () => {
  const result = processInput('');
  // ❌ 当前行为：返回 undefined
  // ✅ 期望行为：返回错误
  expect(result.error).toBe('输入不能为空');
});
```

**目标：** 可靠地触发问题。

#### 1.2 收集证据

```bash
# 添加调试日志
console.log('输入:', input);
console.log('处理前状态:', state);
console.log('处理后状态:', newState);
console.log('返回值:', result);

# 检查堆栈跟踪
Error: Cannot read property 'length' of undefined
    at processInput (processor.ts:15)
    at handleRequest (handler.ts:42)
    at Router.handle (router.ts:88)
```

**目标：** 了解问题发生时的完整上下文。

#### 1.3 追踪根因

使用 **向后追踪法**（参见 `root-cause-tracing.md`）：

```
症状: processInput 返回 undefined
  ↓
直接原因: 没有处理空字符串情况
  ↓
调用者: handleRequest 传入了空字符串
  ↓
更上层: Router 没有验证输入
  ↓
根本原因: 缺少入口点验证
```

**目标：** 找到问题的原始触发点，而不是症状。

#### 1.4 理解为什么会发生

```markdown
## 根因分析

**问题**: processInput 在接收空字符串时返回 undefined

**为什么会发生**:
1. Router 层没有验证输入
2. handleRequest 假设输入总是有效的
3. processInput 没有防御性编程

**为什么之前没发现**:
- 测试用例没有覆盖空输入
- 代码审查时没有考虑边界条件

**影响范围**:
- 所有通过 Router 的请求
- 可能影响其他依赖 processInput 的代码
```

**目标：** 完整理解问题的原因和影响。

#### 1.5 Phase 1 完成检查清单

在进入 Phase 2 之前，必须回答：

- [ ] 我能可靠地复现问题吗？
- [ ] 我理解问题发生时的完整上下文吗？
- [ ] 我找到了根本原因（不是症状）吗？
- [ ] 我理解为什么会发生吗？
- [ ] 我知道影响范围吗？

**如果有任何"否"，继续调查。不要进入 Phase 2。**

---

### Phase 2: 设计修复方案

现在你理解了根因，设计修复方案：

#### 2.1 确定修复层级

使用 **防御深度策略**（参见 `defense-in-depth.md`）：

```typescript
// 层级 1: 入口点验证
router.post('/api/process', (req, res) => {
  if (!req.body.input || req.body.input.trim() === '') {
    return res.status(400).json({ error: '输入不能为空' });
  }
  // ...
});

// 层级 2: 业务逻辑验证
function handleRequest(input: string) {
  if (!input || input.trim() === '') {
    throw new ValidationError('输入不能为空');
  }
  return processInput(input);
}

// 层级 3: 函数级防御
function processInput(input: string) {
  if (!input) {
    return { error: '输入不能为空' };
  }
  // 正常处理
}
```

**原则：** 在多个层级添加验证，不要只在一个地方修复。

#### 2.2 编写修复测试

```typescript
// 测试所有层级的防御
describe('空输入处理', () => {
  test('Router 应该拒绝空输入', async () => {
    const response = await request(app)
      .post('/api/process')
      .send({ input: '' });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('输入不能为空');
  });

  test('handleRequest 应该抛出验证错误', () => {
    expect(() => handleRequest('')).toThrow(ValidationError);
  });

  test('processInput 应该返回错误', () => {
    const result = processInput('');
    expect(result.error).toBe('输入不能为空');
  });
});
```

**目标：** 确保修复在所有层级都有效。

---

### Phase 3: 实施修复

#### 3.1 按优先级修复

```bash
# 1. 先修复根本原因
git add src/router.ts
git commit -m "添加入口点输入验证"

# 2. 然后添加防御层
git add src/handler.ts src/processor.ts
git commit -m "添加多层防御验证"

# 3. 最后添加测试
git add tests/validation.test.ts
git commit -m "添加空输入测试覆盖"
```

#### 3.2 验证修复

```bash
# 运行修复测试
npm test -- validation.test.ts
# ✅ 所有测试通过

# 运行完整测试套件
npm test
# ✅ 没有回归

# 手动验证
curl -X POST http://localhost:3000/api/process -d '{"input":""}'
# ✅ 返回 400 错误
```

---

### Phase 4: 防止再次发生

#### 4.1 添加监控

```typescript
// 添加错误监控
logger.error('验证失败', {
  type: 'EMPTY_INPUT',
  endpoint: '/api/process',
  timestamp: new Date()
});
```

#### 4.2 更新文档

```markdown
## API 文档

### POST /api/process

**请求体**:
```json
{
  "input": "string (必需，不能为空)"
}
```

**错误响应**:
- 400: 输入为空或无效
```

#### 4.3 改进测试覆盖

```typescript
// 添加边界条件测试
describe('边界条件', () => {
  test.each([
    ['', '空字符串'],
    ['   ', '只有空格'],
    [null, 'null'],
    [undefined, 'undefined']
  ])('应该拒绝 %s (%s)', (input, description) => {
    expect(() => processInput(input)).toThrow();
  });
});
```

---

### Phase 4.5: 3次修复失败规则

**如果你尝试了 3 次修复但问题仍然存在，停止修复。**

这是一个信号：
- ❌ 你没有找到真正的根因
- ❌ 架构设计有问题
- ❌ 你在修复症状而不是原因

**此时应该：**

1. **重新进行 Phase 1 根因调查**
   - 你可能遗漏了什么
   - 问题可能比你想的更深

2. **质疑架构**
   ```markdown
   ## 架构反思

   **问题**: 为什么这个 bug 这么难修复？

   **可能的架构问题**:
   - 职责不清晰
   - 耦合太紧
   - 缺少抽象层
   - 错误处理不一致

   **需要重构吗？**
   - 是否需要重新设计这个模块？
   - 是否需要引入新的抽象？
   ```

3. **寻求帮助**
   - 与团队讨论
   - 代码审查
   - 配对编程

**不要继续尝试第 4 次、第 5 次修复。**

---

## 支持技术

### 根因追踪

详见 `root-cause-tracing.md`：
- 向后追踪调用链
- 找到原始触发点
- 堆栈跟踪插桩

### 防御深度

详见 `defense-in-depth.md`：
- 四层验证策略
- 入口点、业务逻辑、环境、调试
- 实际案例分析

### 条件等待

详见 `condition-based-waiting.md`：
- 替代任意超时
- 等待实际条件
- 提高测试可靠性

---

## 常见调试场景

### 场景 1: 测试失败

```bash
# Phase 1: 根因调查
1. 隔离失败的测试
2. 添加调试日志
3. 检查测试假设
4. 追踪到根因

# Phase 2: 设计修复
1. 修复代码或修复测试
2. 添加更多测试用例

# Phase 3: 实施
1. 应用修复
2. 验证所有测试通过

# Phase 4: 防止
1. 添加类似场景的测试
2. 更新测试指南
```

### 场景 2: 生产 Bug

```bash
# Phase 1: 根因调查
1. 收集生产日志
2. 复现本地环境
3. 创建复现测试
4. 追踪根因

# Phase 2: 设计修复
1. 设计多层防御
2. 考虑回滚方案
3. 编写修复测试

# Phase 3: 实施
1. 应用修复
2. 在测试环境验证
3. 部署到生产

# Phase 4: 防止
1. 添加监控告警
2. 改进测试覆盖
3. 更新部署检查清单
```

### 场景 3: 性能问题

```bash
# Phase 1: 根因调查
1. 性能分析（profiling）
2. 识别瓶颈
3. 测量基准性能
4. 理解为什么慢

# Phase 2: 设计优化
1. 设计优化方案
2. 评估权衡
3. 编写性能测试

# Phase 3: 实施
1. 应用优化
2. 验证性能提升
3. 确保功能正确

# Phase 4: 防止
1. 添加性能监控
2. 设置性能基准
3. 添加性能测试
```

---

## 调试工具箱

### 日志和追踪

```typescript
// 结构化日志
logger.debug('处理输入', {
  input,
  userId,
  timestamp: Date.now(),
  stackTrace: new Error().stack
});

// 性能追踪
console.time('processInput');
const result = processInput(input);
console.timeEnd('processInput');
```

### 断点调试

```typescript
// 条件断点
if (input === '' && process.env.DEBUG) {
  debugger; // 只在特定条件下暂停
}
```

### 测试隔离

```typescript
// 隔离失败的测试
test.only('应该处理空输入', () => {
  // 只运行这个测试
});
```

---

## 记住

**调试是科学，不是艺术：**

1. **观察** - 收集证据
2. **假设** - 形成理论
3. **实验** - 测试理论
4. **结论** - 确认根因
5. **修复** - 应用解决方案
6. **验证** - 确保有效
7. **防止** - 避免再次发生

**不要：**
- ❌ 猜测和尝试
- ❌ 修复症状
- ❌ 跳过根因分析
- ❌ 在不理解的情况下修复

**要：**
- ✅ 系统化调查
- ✅ 找到根本原因
- ✅ 多层防御
- ✅ 防止再次发生

**现在开始系统化调试。**
