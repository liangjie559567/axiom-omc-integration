---
name: test-driven-development
description: 使用测试驱动开发实现任何功能或修复任何 bug，在编写实现代码之前必须先编写测试
---

# 测试驱动开发 (TDD)

## 铁律

**在编写任何生产代码之前，必须先有一个失败的测试。**

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

## 核心原则

测试驱动开发不是可选的。这是一个强制性的工作流程，适用于：

- ✅ 新功能实现
- ✅ Bug 修复
- ✅ 重构
- ✅ 性能优化
- ✅ 任何改变代码行为的操作

## RED-GREEN-REFACTOR 循环

### 1. RED（红色）- 编写失败的测试

```typescript
// ❌ 测试必须失败
test('应该验证用户输入', () => {
  const result = validateInput('invalid');
  expect(result.isValid).toBe(false);
  expect(result.errors).toContain('格式无效');
});
```

**运行测试，确认它失败。**

如果测试通过了，说明：
- 测试写错了
- 功能已经存在
- 测试没有测试任何东西

### 2. GREEN（绿色）- 编写最小实现

```typescript
// ✅ 最小实现让测试通过
function validateInput(input: string): ValidationResult {
  if (input === 'invalid') {
    return {
      isValid: false,
      errors: ['格式无效']
    };
  }
  return { isValid: true, errors: [] };
}
```

**运行测试，确认它通过。**

不要写多余的代码。只写让测试通过的最小代码。

### 3. REFACTOR（重构）- 改进代码

```typescript
// ✅ 重构为通用实现
function validateInput(input: string): ValidationResult {
  const pattern = /^[a-zA-Z0-9]+$/;

  if (!pattern.test(input)) {
    return {
      isValid: false,
      errors: ['格式无效：只允许字母和数字']
    };
  }

  return { isValid: true, errors: [] };
}
```

**运行测试，确认仍然通过。**

重构时不改变行为，只改进结构。

## 违规处理

### 如果你在测试之前写了代码

**立即停止。删除代码。重新开始。**

```bash
# 撤销未测试的代码
git checkout -- src/untested-feature.ts
```

没有例外。没有"这次就算了"。

### 如果你跳过了 RED 阶段

**测试必须先失败。**

如果测试一开始就通过：
1. 检查测试是否正确
2. 检查功能是否已存在
3. 重写测试确保它能捕获问题

## 合理化表格

你可能会想跳过 TDD。以下是常见借口及其反驳：

| 借口 | 现实 |
|------|------|
| "这个改动太简单了" | 简单的代码最容易出 bug。测试很快。 |
| "我稍后会补测试" | 不会的。现在就写。 |
| "我只是在探索" | 探索完就删除代码。然后用 TDD 重写。 |
| "测试会拖慢速度" | 调试未测试的代码更慢。 |
| "我知道这能工作" | 那测试应该很容易通过。证明给我看。 |
| "这是一次性代码" | 没有一次性代码。都会留下来。 |
| "我在修复紧急 bug" | 紧急 bug 更需要测试防止再次发生。 |
| "测试这个很难" | 难测试的代码是设计不良的信号。 |

## 实际工作流程

### 功能开发示例

```bash
# 1. RED - 编写失败的测试
$ cat > tests/user-auth.test.ts
test('应该拒绝弱密码', () => {
  expect(() => createUser('user', '123')).toThrow('密码太弱');
});

$ npm test
# ❌ FAIL: createUser is not defined

# 2. GREEN - 最小实现
$ cat > src/user-auth.ts
export function createUser(username: string, password: string) {
  if (password === '123') {
    throw new Error('密码太弱');
  }
  return { username, password };
}

$ npm test
# ✅ PASS: 1 test passed

# 3. REFACTOR - 改进实现
$ cat > src/user-auth.ts
export function createUser(username: string, password: string) {
  if (password.length < 8) {
    throw new Error('密码太弱：至少需要 8 个字符');
  }
  return { username, password };
}

$ npm test
# ✅ PASS: 1 test passed

# 4. 添加更多测试用例
$ cat >> tests/user-auth.test.ts
test('应该接受强密码', () => {
  const user = createUser('user', 'StrongP@ss123');
  expect(user.username).toBe('user');
});

$ npm test
# ✅ PASS: 2 tests passed
```

### Bug 修复示例

```bash
# 1. RED - 编写复现 bug 的测试
$ cat > tests/bug-123.test.ts
test('修复 #123: 空输入应该返回错误', () => {
  const result = processInput('');
  expect(result.error).toBe('输入不能为空');
});

$ npm test
# ❌ FAIL: Expected error, got undefined

# 2. GREEN - 修复 bug
$ cat > src/processor.ts
export function processInput(input: string) {
  if (input === '') {
    return { error: '输入不能为空' };
  }
  // ... 原有逻辑
}

$ npm test
# ✅ PASS: Bug 已修复

# 3. 提交时引用测试
$ git add tests/bug-123.test.ts src/processor.ts
$ git commit -m "修复 #123: 处理空输入

测试: tests/bug-123.test.ts
验证: npm test 全部通过"
```

## 测试类型

### 单元测试（最常用）

```typescript
// 测试单个函数或类
test('calculateTotal 应该正确求和', () => {
  expect(calculateTotal([1, 2, 3])).toBe(6);
});
```

### 集成测试

```typescript
// 测试多个组件协作
test('用户注册流程应该完整工作', async () => {
  const user = await registerUser('test@example.com', 'password');
  const saved = await database.findUser(user.id);
  expect(saved.email).toBe('test@example.com');
});
```

### 端到端测试

```typescript
// 测试完整用户流程
test('用户应该能够登录并查看仪表板', async () => {
  await page.goto('/login');
  await page.fill('[name=email]', 'user@example.com');
  await page.fill('[name=password]', 'password');
  await page.click('button[type=submit]');
  await expect(page).toHaveURL('/dashboard');
});
```

## 何时可以跳过测试

**永远不能。**

即使是：
- 配置文件更改 → 测试配置加载
- 文档更新 → 测试文档构建
- 依赖升级 → 测试兼容性
- 性能优化 → 测试性能基准

## 测试覆盖率目标

- **最低要求**: 80% 代码覆盖率
- **推荐目标**: 90%+ 代码覆盖率
- **关键路径**: 100% 覆盖率

```bash
# 检查覆盖率
$ npm test -- --coverage

# 覆盖率报告
Statements   : 92.5% ( 185/200 )
Branches     : 88.2% ( 45/51 )
Functions    : 95.0% ( 38/40 )
Lines        : 93.1% ( 175/188 )
```

## 常见陷阱

### ❌ 陷阱 1: 测试实现细节

```typescript
// ❌ 错误：测试内部实现
test('应该调用 validateEmail', () => {
  const spy = jest.spyOn(validator, 'validateEmail');
  createUser('user@example.com');
  expect(spy).toHaveBeenCalled();
});

// ✅ 正确：测试行为
test('应该拒绝无效邮箱', () => {
  expect(() => createUser('invalid')).toThrow('邮箱无效');
});
```

### ❌ 陷阱 2: 测试过于脆弱

```typescript
// ❌ 错误：依赖具体错误消息
expect(error.message).toBe('Email is invalid');

// ✅ 正确：测试错误类型
expect(error).toBeInstanceOf(ValidationError);
expect(error.field).toBe('email');
```

### ❌ 陷阱 3: 测试之间有依赖

```typescript
// ❌ 错误：测试依赖执行顺序
let userId;
test('应该创建用户', () => {
  userId = createUser('test');
});
test('应该找到用户', () => {
  expect(findUser(userId)).toBeDefined();
});

// ✅ 正确：每个测试独立
test('应该找到创建的用户', () => {
  const userId = createUser('test');
  expect(findUser(userId)).toBeDefined();
});
```

## 相关技能

- `testing-anti-patterns.md` - 测试反模式和最佳实践
- `systematic-debugging` - 系统化调试流程
- `verification-before-completion` - 完成前验证

## 记住

**如果没有测试，就没有代码。**

测试不是负担，是自由。有了测试，你可以：
- 自信地重构
- 快速发现回归
- 清晰地记录行为
- 安全地修改代码

**现在开始写测试。**
