# 条件等待模式

## 核心原则

**等待实际关心的条件，而不是猜测需要多长时间。**

不要使用任意的超时时间，要等待具体的条件满足。

---

## 问题：任意超时

### ❌ 错误模式

```typescript
test('应该加载数据', async () => {
  triggerDataLoad();

  // ❌ 猜测需要 50ms
  await new Promise(r => setTimeout(r, 50));

  expect(getData()).toBeDefined();
});
```

**问题：**
- 在快速机器上浪费时间（数据可能 10ms 就加载完了）
- 在慢速机器上测试失败（数据可能需要 100ms）
- 在 CI 环境中不稳定（负载不同）
- 测试变得脆弱和不可靠

---

## 解决方案：条件等待

### ✅ 正确模式

```typescript
test('应该加载数据', async () => {
  triggerDataLoad();

  // ✅ 等待实际条件
  await waitFor(() => getData() !== undefined);

  expect(getData()).toBeDefined();
});
```

**优势：**
- 在快速机器上立即完成
- 在慢速机器上等待足够长
- 在所有环境中稳定
- 测试更快更可靠

---

## 实际影响

### 案例：测试套件优化

**之前（使用任意超时）：**
```typescript
// 100 个测试，每个等待 50ms
test('测试 1', async () => {
  await new Promise(r => setTimeout(r, 50));
  // ...
});

// 总时间：100 × 50ms = 5000ms
// 通过率：60%（在慢速 CI 上）
```

**之后（使用条件等待）：**
```typescript
// 100 个测试，等待实际条件
test('测试 1', async () => {
  await waitFor(() => condition);
  // ...
});

// 总时间：100 × 平均 30ms = 3000ms
// 通过率：100%（在所有环境）
```

**结果：**
- ✅ 通过率：60% → 100%
- ✅ 执行时间：5000ms → 3000ms（减少 40%）
- ✅ 稳定性：不稳定 → 完全稳定

---

## waitFor 实现

### 基础实现

```typescript
async function waitFor(
  condition: () => boolean,
  options: {
    timeout?: number;
    interval?: number;
    message?: string;
  } = {}
): Promise<void> {
  const {
    timeout = 5000,
    interval = 50,
    message = '等待条件超时'
  } = options;

  const startTime = Date.now();

  while (true) {
    // 检查条件
    if (condition()) {
      return; // 条件满足，立即返回
    }

    // 检查超时
    if (Date.now() - startTime > timeout) {
      throw new Error(`${message}（${timeout}ms）`);
    }

    // 等待一小段时间后重试
    await new Promise(r => setTimeout(r, interval));
  }
}
```

### 使用示例

```typescript
// 等待元素出现
await waitFor(() => document.querySelector('.loading') === null);

// 等待数据加载
await waitFor(() => getData() !== undefined);

// 等待状态改变
await waitFor(() => getStatus() === 'ready');

// 自定义超时和消息
await waitFor(
  () => getCount() > 0,
  {
    timeout: 10000,
    message: '等待数据加载'
  }
);
```

---

## 高级实现

### 支持异步条件

```typescript
async function waitFor<T>(
  condition: () => T | Promise<T>,
  options: {
    timeout?: number;
    interval?: number;
    message?: string;
  } = {}
): Promise<T> {
  const {
    timeout = 5000,
    interval = 50,
    message = '等待条件超时'
  } = options;

  const startTime = Date.now();

  while (true) {
    try {
      // 支持同步和异步条件
      const result = await condition();

      // 如果结果是 truthy，返回结果
      if (result) {
        return result;
      }
    } catch (error) {
      // 条件检查失败，继续等待
    }

    // 检查超时
    if (Date.now() - startTime > timeout) {
      throw new Error(`${message}（${timeout}ms）`);
    }

    // 等待后重试
    await new Promise(r => setTimeout(r, interval));
  }
}
```

### 使用示例

```typescript
// 等待异步操作
const data = await waitFor(async () => {
  const response = await fetch('/api/data');
  return response.ok ? response.json() : null;
});

// 等待文件存在
const fileExists = await waitFor(async () => {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
});
```

---

## 常见使用场景

### 场景 1: 等待 DOM 元素

```typescript
// ❌ 错误：任意超时
await new Promise(r => setTimeout(r, 100));
const button = document.querySelector('button');

// ✅ 正确：等待元素出现
const button = await waitFor(() =>
  document.querySelector('button')
);
```

---

### 场景 2: 等待 API 响应

```typescript
// ❌ 错误：猜测响应时间
fetchData();
await new Promise(r => setTimeout(r, 200));
const data = getData();

// ✅ 正确：等待数据可用
fetchData();
const data = await waitFor(() => getData());
```

---

### 场景 3: 等待状态改变

```typescript
// ❌ 错误：轮询固定次数
for (let i = 0; i < 10; i++) {
  if (isReady()) break;
  await new Promise(r => setTimeout(r, 50));
}

// ✅ 正确：等待状态
await waitFor(() => isReady());
```

---

### 场景 4: 等待动画完成

```typescript
// ❌ 错误：硬编码动画时间
element.classList.add('fade-out');
await new Promise(r => setTimeout(r, 300));

// ✅ 正确：等待动画结束
element.classList.add('fade-out');
await waitFor(() =>
  getComputedStyle(element).opacity === '0'
);
```

---

### 场景 5: 等待文件写入

```typescript
// ❌ 错误：假设写入立即完成
await fs.promises.writeFile(path, data);
const content = await fs.promises.readFile(path);

// ✅ 正确：等待文件可读
await fs.promises.writeFile(path, data);
await waitFor(async () => {
  try {
    await fs.promises.access(path, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
});
const content = await fs.promises.readFile(path);
```

---

## 测试框架集成

### Jest / Vitest

```typescript
// 使用内置的 waitFor
import { waitFor } from '@testing-library/react';

test('应该显示加载完成', async () => {
  render(<App />);

  await waitFor(() => {
    expect(screen.getByText('加载完成')).toBeInTheDocument();
  });
});
```

### Playwright

```typescript
// Playwright 内置条件等待
test('应该显示结果', async ({ page }) => {
  await page.goto('/');

  // ✅ 自动等待元素出现
  await page.click('button');
  await page.waitForSelector('.result');

  // ✅ 等待特定状态
  await page.waitForFunction(() =>
    document.querySelector('.status')?.textContent === 'ready'
  );
});
```

### Cypress

```typescript
// Cypress 自动重试断言
it('应该显示结果', () => {
  cy.visit('/');
  cy.click('button');

  // ✅ 自动等待和重试
  cy.get('.result').should('be.visible');
  cy.get('.status').should('have.text', 'ready');
});
```

---

## 最佳实践

### 1. 设置合理的超时

```typescript
// ✅ 根据操作类型设置超时
await waitFor(() => condition, {
  timeout: 1000  // 快速操作：1秒
});

await waitFor(() => condition, {
  timeout: 5000  // 正常操作：5秒
});

await waitFor(() => condition, {
  timeout: 30000  // 慢速操作：30秒
});
```

---

### 2. 提供清晰的错误消息

```typescript
// ✅ 描述性错误消息
await waitFor(
  () => getData() !== undefined,
  {
    message: '等待 API 数据加载失败'
  }
);

// ✅ 包含上下文信息
await waitFor(
  () => getStatus() === 'ready',
  {
    message: `等待状态变为 ready，当前状态：${getStatus()}`
  }
);
```

---

### 3. 避免过于频繁的检查

```typescript
// ❌ 错误：检查太频繁
await waitFor(() => condition, {
  interval: 1  // 每 1ms 检查一次，浪费 CPU
});

// ✅ 正确：合理的检查间隔
await waitFor(() => condition, {
  interval: 50  // 每 50ms 检查一次
});
```

---

### 4. 条件应该是幂等的

```typescript
// ❌ 错误：条件有副作用
let count = 0;
await waitFor(() => {
  count++;  // 副作用
  return count > 5;
});

// ✅ 正确：纯函数条件
await waitFor(() => getCount() > 5);
```

---

### 5. 处理条件检查错误

```typescript
// ✅ 条件检查可能抛出错误
await waitFor(() => {
  try {
    const element = document.querySelector('.result');
    return element.textContent === 'done';
  } catch {
    return false;  // 元素不存在时返回 false
  }
});
```

---

## 反模式

### ❌ 反模式 1: 嵌套超时

```typescript
// ❌ 错误：多层超时
await new Promise(r => setTimeout(r, 100));
await new Promise(r => setTimeout(r, 200));
await new Promise(r => setTimeout(r, 300));

// ✅ 正确：等待最终条件
await waitFor(() => isFinalStateReached());
```

---

### ❌ 反模式 2: 超时后重试

```typescript
// ❌ 错误：超时后手动重试
for (let i = 0; i < 3; i++) {
  await new Promise(r => setTimeout(r, 1000));
  if (isReady()) break;
}

// ✅ 正确：使用更长的超时
await waitFor(() => isReady(), {
  timeout: 3000
});
```

---

### ❌ 反模式 3: 轮询而不是事件

```typescript
// ❌ 错误：轮询检查
while (!isReady()) {
  await new Promise(r => setTimeout(r, 100));
}

// ✅ 更好：使用事件
await new Promise(resolve => {
  eventEmitter.once('ready', resolve);
});

// ✅ 或者使用 waitFor
await waitFor(() => isReady());
```

---

## 性能优化

### 优化 1: 早期退出

```typescript
// ✅ 条件满足时立即返回
async function waitFor(condition, options = {}) {
  // 先检查一次，可能已经满足
  if (condition()) {
    return;  // 立即返回，不等待
  }

  // 然后才开始轮询
  // ...
}
```

---

### 优化 2: 指数退避

```typescript
// ✅ 开始快速检查，然后逐渐减慢
async function waitForWithBackoff(condition, options = {}) {
  let interval = 10;  // 开始 10ms
  const maxInterval = 500;  // 最大 500ms

  while (true) {
    if (condition()) return;

    await new Promise(r => setTimeout(r, interval));

    // 指数增长，但不超过最大值
    interval = Math.min(interval * 1.5, maxInterval);
  }
}
```

---

### 优化 3: 批量检查

```typescript
// ✅ 一次检查多个条件
const results = await Promise.all([
  waitFor(() => condition1()),
  waitFor(() => condition2()),
  waitFor(() => condition3())
]);
```

---

## 记住

**条件等待原则：**

1. **等待条件，不是时间** - 关心"什么时候"，不是"多久"
2. **设置合理超时** - 防止无限等待
3. **提供清晰错误** - 帮助调试失败
4. **条件应该纯净** - 无副作用，可重复检查
5. **早期退出优化** - 条件满足立即返回

**使用场景：**
- ✅ DOM 元素出现/消失
- ✅ API 数据加载
- ✅ 状态改变
- ✅ 动画完成
- ✅ 文件操作完成
- ✅ 异步操作完成

**不要：**
- ❌ 使用任意超时
- ❌ 猜测操作时间
- ❌ 硬编码等待时间
- ❌ 轮询固定次数

**要：**
- ✅ 等待实际条件
- ✅ 设置合理超时
- ✅ 提供错误消息
- ✅ 优化性能

**现在开始使用条件等待。**
