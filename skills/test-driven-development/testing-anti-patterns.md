# 测试反模式和最佳实践

## 三大铁律

### 铁律 1: 永远不要测试 Mock 行为

**❌ 错误示例：**

```typescript
test('应该调用 sendEmail', () => {
  const mockSendEmail = jest.fn();
  const service = new UserService(mockSendEmail);

  service.registerUser('user@example.com');

  // ❌ 测试 mock 是否被调用
  expect(mockSendEmail).toHaveBeenCalledWith('user@example.com');
});
```

**问题：** 这个测试只验证了你的 mock 被调用，而不是验证实际行为。

**✅ 正确示例：**

```typescript
test('应该发送欢迎邮件给新用户', async () => {
  const emailService = new TestEmailService();
  const service = new UserService(emailService);

  await service.registerUser('user@example.com');

  // ✅ 验证实际结果
  const sentEmails = emailService.getSentEmails();
  expect(sentEmails).toHaveLength(1);
  expect(sentEmails[0].to).toBe('user@example.com');
  expect(sentEmails[0].subject).toContain('欢迎');
});
```

**原则：** 测试行为，不是实现。使用真实的测试替身（test doubles），而不是验证 mock 调用。

---

### 铁律 2: 永远不要为测试添加生产代码方法

**❌ 错误示例：**

```typescript
class UserService {
  private users: User[] = [];

  registerUser(email: string) {
    this.users.push({ email });
  }

  // ❌ 仅为测试添加的方法
  __testOnly_getUsers() {
    return this.users;
  }
}

test('应该注册用户', () => {
  const service = new UserService();
  service.registerUser('user@example.com');

  // ❌ 使用测试专用方法
  expect(service.__testOnly_getUsers()).toHaveLength(1);
});
```

**问题：**
- 污染生产代码
- 破坏封装
- 可能在生产环境被误用

**✅ 正确示例：**

```typescript
class UserService {
  private users: User[] = [];

  registerUser(email: string) {
    this.users.push({ email });
  }

  // ✅ 真实的公共 API
  getUserCount(): number {
    return this.users.length;
  }
}

test('应该注册用户', () => {
  const service = new UserService();
  service.registerUser('user@example.com');

  // ✅ 使用真实的公共 API
  expect(service.getUserCount()).toBe(1);
});
```

**原则：** 如果你需要测试专用方法，说明：
1. 你的公共 API 设计不完整
2. 你在测试实现细节而非行为
3. 你的类职责太多，需要拆分

---

### 铁律 3: 永远不要在不理解的情况下 Mock

**❌ 错误示例：**

```typescript
test('应该保存用户', async () => {
  // ❌ 不理解 database.save 的行为就 mock 它
  const mockSave = jest.fn().mockResolvedValue({ id: 1 });
  const database = { save: mockSave };

  const service = new UserService(database);
  await service.createUser('test@example.com');

  expect(mockSave).toHaveBeenCalled();
});
```

**问题：**
- 不知道真实的 `database.save` 会做什么
- 不知道它可能抛出什么错误
- 不知道它的返回值结构
- 测试可能通过，但生产代码会失败

**✅ 正确示例：**

```typescript
test('应该保存用户到数据库', async () => {
  // ✅ 使用内存数据库或测试数据库
  const database = new InMemoryDatabase();
  const service = new UserService(database);

  const user = await service.createUser('test@example.com');

  // ✅ 验证实际保存的数据
  const saved = await database.findById(user.id);
  expect(saved.email).toBe('test@example.com');
  expect(saved.createdAt).toBeInstanceOf(Date);
});
```

**原则：**
- 优先使用真实实现（内存版本、测试版本）
- 如果必须 mock，先阅读文档和源码
- 理解所有可能的返回值和错误情况
- Mock 应该反映真实行为

---

## 反模式 4: 不完整的 Mock

**❌ 错误示例：**

```typescript
test('应该处理用户数据', () => {
  // ❌ 只 mock 了当前测试需要的字段
  const mockUser = {
    id: 1,
    name: 'Test User'
  };

  const result = processUser(mockUser);
  expect(result.displayName).toBe('Test User');
});
```

**问题：** 真实的 User 对象可能有更多字段：

```typescript
interface User {
  id: number;
  name: string;
  email: string;        // ❌ 缺失
  role: UserRole;       // ❌ 缺失
  createdAt: Date;      // ❌ 缺失
  preferences: object;  // ❌ 缺失
}
```

如果 `processUser` 依赖这些字段，测试会通过但生产代码会失败。

**✅ 正确示例：**

```typescript
// ✅ 创建完整的测试工厂
function createTestUser(overrides?: Partial<User>): User {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    createdAt: new Date(),
    preferences: {},
    ...overrides
  };
}

test('应该处理用户数据', () => {
  // ✅ 使用完整的用户对象
  const user = createTestUser({ name: 'Custom Name' });

  const result = processUser(user);
  expect(result.displayName).toBe('Custom Name');
});
```

**原则：** Mock 完整的数据结构，只覆盖测试特定需要的字段。

---

## 反模式 5: 测试过于脆弱

**❌ 错误示例：**

```typescript
test('应该返回错误消息', () => {
  // ❌ 依赖具体的错误消息文本
  expect(() => validateEmail('invalid'))
    .toThrow('Email address is invalid. Please provide a valid email.');
});
```

**问题：**
- 错误消息改动会破坏测试
- 国际化会破坏测试
- 测试实现细节而非行为

**✅ 正确示例：**

```typescript
test('应该拒绝无效邮箱', () => {
  // ✅ 测试错误类型和关键信息
  expect(() => validateEmail('invalid'))
    .toThrow(ValidationError);

  try {
    validateEmail('invalid');
  } catch (error) {
    expect(error.field).toBe('email');
    expect(error.code).toBe('INVALID_FORMAT');
  }
});
```

**原则：** 测试行为和契约，不是具体的实现细节。

---

## 反模式 6: 测试之间有依赖

**❌ 错误示例：**

```typescript
let userId: number;

test('应该创建用户', async () => {
  // ❌ 设置全局状态
  const user = await createUser('test@example.com');
  userId = user.id;
  expect(user.email).toBe('test@example.com');
});

test('应该更新用户', async () => {
  // ❌ 依赖前一个测试的状态
  await updateUser(userId, { name: 'New Name' });
  const user = await getUser(userId);
  expect(user.name).toBe('New Name');
});
```

**问题：**
- 测试顺序很重要
- 一个测试失败会导致其他测试失败
- 无法单独运行测试
- 难以调试

**✅ 正确示例：**

```typescript
test('应该创建用户', async () => {
  // ✅ 独立的测试
  const user = await createUser('test@example.com');
  expect(user.email).toBe('test@example.com');
});

test('应该更新用户', async () => {
  // ✅ 创建自己的测试数据
  const user = await createUser('test@example.com');

  await updateUser(user.id, { name: 'New Name' });
  const updated = await getUser(user.id);
  expect(updated.name).toBe('New Name');
});
```

**原则：** 每个测试应该完全独立，可以以任何顺序运行。

---

## 反模式 7: 测试覆盖率游戏

**❌ 错误示例：**

```typescript
// ❌ 为了覆盖率而写的无意义测试
test('应该导出函数', () => {
  expect(typeof myFunction).toBe('function');
});

test('应该有正确的属性', () => {
  const obj = new MyClass();
  expect(obj).toHaveProperty('name');
  expect(obj).toHaveProperty('age');
});
```

**问题：** 这些测试不验证任何有意义的行为。

**✅ 正确示例：**

```typescript
// ✅ 测试实际行为
test('应该正确计算年龄', () => {
  const person = new Person('John', new Date('1990-01-01'));
  expect(person.getAge()).toBeGreaterThan(30);
});

test('应该验证名字格式', () => {
  expect(() => new Person('', new Date()))
    .toThrow('名字不能为空');
});
```

**原则：** 追求有意义的测试，而不是高覆盖率数字。

---

## 反模式 8: 过度使用 Snapshot 测试

**❌ 错误示例：**

```typescript
test('应该渲染用户列表', () => {
  // ❌ 盲目使用 snapshot
  const component = render(<UserList users={mockUsers} />);
  expect(component).toMatchSnapshot();
});
```

**问题：**
- 不知道测试什么
- 任何改动都会更新 snapshot
- 难以审查 snapshot 变化
- 测试变得无意义

**✅ 正确示例：**

```typescript
test('应该显示所有用户名', () => {
  // ✅ 测试具体行为
  const users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ];

  const { getByText } = render(<UserList users={users} />);

  expect(getByText('Alice')).toBeInTheDocument();
  expect(getByText('Bob')).toBeInTheDocument();
});

test('应该显示用户数量', () => {
  const users = [{ id: 1, name: 'Alice' }];
  const { getByText } = render(<UserList users={users} />);

  expect(getByText('共 1 个用户')).toBeInTheDocument();
});
```

**原则：** Snapshot 测试适合稳定的输出（如 CLI 帮助文本），不适合动态 UI。

---

## 反模式 9: 异步测试处理不当

**❌ 错误示例：**

```typescript
test('应该加载数据', () => {
  // ❌ 忘记 await 或 return
  fetchData().then(data => {
    expect(data).toBeDefined();
  });
  // 测试会在 Promise 解决前结束
});
```

**✅ 正确示例：**

```typescript
test('应该加载数据', async () => {
  // ✅ 使用 async/await
  const data = await fetchData();
  expect(data).toBeDefined();
});

// 或者
test('应该加载数据', () => {
  // ✅ 返回 Promise
  return fetchData().then(data => {
    expect(data).toBeDefined();
  });
});
```

**原则：** 异步测试必须使用 `async/await` 或返回 Promise。

---

## 反模式 10: 测试私有方法

**❌ 错误示例：**

```typescript
class Calculator {
  private validateInput(n: number): boolean {
    return !isNaN(n) && isFinite(n);
  }

  add(a: number, b: number): number {
    if (!this.validateInput(a) || !this.validateInput(b)) {
      throw new Error('无效输入');
    }
    return a + b;
  }
}

test('应该验证输入', () => {
  const calc = new Calculator();
  // ❌ 尝试测试私有方法
  expect((calc as any).validateInput(5)).toBe(true);
});
```

**✅ 正确示例：**

```typescript
test('应该拒绝无效输入', () => {
  const calc = new Calculator();
  // ✅ 通过公共 API 测试
  expect(() => calc.add(NaN, 5)).toThrow('无效输入');
  expect(() => calc.add(5, Infinity)).toThrow('无效输入');
});

test('应该接受有效输入', () => {
  const calc = new Calculator();
  expect(calc.add(2, 3)).toBe(5);
});
```

**原则：** 只测试公共 API。私有方法通过公共方法间接测试。

---

## 最佳实践总结

### ✅ 做这些

1. **测试行为，不是实现**
   - 关注"做什么"，不是"怎么做"

2. **使用真实的测试替身**
   - 内存数据库、测试服务、假对象

3. **保持测试独立**
   - 每个测试可以单独运行

4. **使用描述性的测试名称**
   - `test('应该在密码错误时返回 401', ...)`

5. **遵循 AAA 模式**
   - Arrange（准备）、Act（执行）、Assert（断言）

6. **测试边界条件**
   - 空值、null、undefined、边界值

7. **一个测试一个断言概念**
   - 可以有多个 expect，但测试一个逻辑概念

### ❌ 不要做这些

1. **不要测试框架或库**
   - 相信 React、Express 等已经测试过

2. **不要测试第三方代码**
   - 测试你的代码如何使用它们

3. **不要在测试中使用随机数据**
   - 使用固定的测试数据

4. **不要忽略失败的测试**
   - 修复或删除，不要注释掉

5. **不要写太大的测试**
   - 大测试难以理解和维护

6. **不要依赖测试执行顺序**
   - 测试应该可以并行运行

---

## 记住

**好的测试是：**
- ✅ 快速的
- ✅ 独立的
- ✅ 可重复的
- ✅ 自验证的
- ✅ 及时的

**坏的测试是：**
- ❌ 脆弱的
- ❌ 依赖的
- ❌ 慢的
- ❌ 不清晰的
- ❌ 无意义的

**当你发现自己在写坏测试时，停下来重新思考。**
