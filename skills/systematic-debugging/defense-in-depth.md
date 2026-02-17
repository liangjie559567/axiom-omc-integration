# 防御深度策略

## 核心原则

**在多个层级添加验证，不要只在一个地方防御。**

每一层都应该独立验证输入，不要假设上层已经验证过。

---

## 四层防御策略

### 层级 1: 入口点验证

**在数据进入系统的第一时间验证。**

```typescript
// API 路由层
router.post('/api/users', (req, res) => {
  // ✅ 第一道防线：入口点验证
  if (!req.body.email) {
    return res.status(400).json({
      error: 'email 是必需的'
    });
  }

  if (!isValidEmail(req.body.email)) {
    return res.status(400).json({
      error: 'email 格式无效'
    });
  }

  // 继续处理
  const user = await createUser(req.body);
  res.json(user);
});
```

**目的：** 尽早拒绝无效输入，保护下游代码。

---

### 层级 2: 业务逻辑验证

**在业务逻辑层验证业务规则。**

```typescript
// 业务逻辑层
async function createUser(data: CreateUserInput) {
  // ✅ 第二道防线：业务逻辑验证
  if (!data.email) {
    throw new ValidationError('email 是必需的');
  }

  if (!isValidEmail(data.email)) {
    throw new ValidationError('email 格式无效');
  }

  // 业务规则验证
  const existingUser = await userRepository.findByEmail(data.email);
  if (existingUser) {
    throw new BusinessError('该邮箱已被注册');
  }

  // 创建用户
  return await userRepository.create(data);
}
```

**目的：** 确保业务规则被执行，即使入口点验证被绕过。

---

### 层级 3: 环境守卫

**在关键操作前验证环境状态。**

```typescript
// 数据访问层
class UserRepository {
  async create(data: User) {
    // ✅ 第三道防线：环境守卫
    if (!this.database) {
      throw new Error('数据库未初始化');
    }

    if (!this.database.isConnected()) {
      throw new Error('数据库未连接');
    }

    if (!data.email) {
      throw new Error('email 不能为空');
    }

    // 执行数据库操作
    return await this.database.insert('users', data);
  }
}
```

**目的：** 防止在错误的环境状态下执行操作。

---

### 层级 4: 调试插桩

**添加详细的日志和断言，帮助快速定位问题。**

```typescript
// 所有层级
function processUserData(email: string) {
  // ✅ 第四道防线：调试插桩
  logger.debug('处理用户数据', {
    email,
    emailType: typeof email,
    emailLength: email?.length,
    isValidFormat: isValidEmail(email),
    timestamp: Date.now(),
    stack: new Error().stack
  });

  // 断言
  assert(email, 'email 不能为空');
  assert(typeof email === 'string', 'email 必须是字符串');
  assert(email.length > 0, 'email 不能是空字符串');

  // 处理逻辑
  return normalizeEmail(email);
}
```

**目的：** 在问题发生时提供详细的上下文信息。

---

## 实际案例：空 projectDir Bug

### 问题描述

```
错误: Cannot read property 'length' of undefined
位置: src/utils/path-validator.ts:15
```

### 四层防御实施

#### 层级 1: 入口点验证（CLI 参数）

```typescript
// bin/axiom.ts
function parseArgs(argv: string[]) {
  const args = minimist(argv);

  // ✅ 层级 1：验证 CLI 参数
  if (!args['project-dir']) {
    console.error('错误: --project-dir 参数是必需的');
    console.error('用法: axiom --project-dir /path/to/project');
    process.exit(1);
  }

  const projectDir = path.resolve(args['project-dir']);

  if (!fs.existsSync(projectDir)) {
    console.error(`错误: 项目目录不存在: ${projectDir}`);
    process.exit(1);
  }

  return { projectDir };
}
```

**捕获：** 在测试中，这一层捕获了 50% 的问题。

---

#### 层级 2: 业务逻辑验证（ConfigManager）

```typescript
// src/config/config-manager.ts
class ConfigManager {
  private projectDir: string;

  constructor(options: ConfigOptions) {
    // ✅ 层级 2：验证配置完整性
    if (!options.projectDir) {
      throw new ConfigError('projectDir 是必需的配置项');
    }

    if (typeof options.projectDir !== 'string') {
      throw new ConfigError('projectDir 必须是字符串');
    }

    if (options.projectDir.trim() === '') {
      throw new ConfigError('projectDir 不能是空字符串');
    }

    this.projectDir = options.projectDir;
  }

  getProjectDir(): string {
    // ✅ 额外的运行时检查
    if (!this.projectDir) {
      throw new Error('projectDir 未初始化');
    }
    return this.projectDir;
  }
}
```

**捕获：** 在测试中，这一层捕获了 30% 的问题（层级 1 未捕获的）。

---

#### 层级 3: 环境守卫（PathValidator）

```typescript
// src/utils/path-validator.ts
class PathValidator {
  validatePath(projectDir: string, relativePath: string): boolean {
    // ✅ 层级 3：函数级防御
    if (!projectDir) {
      throw new Error('projectDir 参数不能为空');
    }

    if (typeof projectDir !== 'string') {
      throw new TypeError(`projectDir 必须是字符串，收到: ${typeof projectDir}`);
    }

    if (projectDir.length === 0) {
      throw new Error('projectDir 不能是空字符串');
    }

    if (!path.isAbsolute(projectDir)) {
      throw new Error(`projectDir 必须是绝对路径: ${projectDir}`);
    }

    // 正常验证逻辑
    const fullPath = path.join(projectDir, relativePath);
    return fullPath.startsWith(projectDir);
  }
}
```

**捕获：** 在测试中，这一层捕获了 15% 的问题（前两层未捕获的）。

---

#### 层级 4: 调试插桩（所有层级）

```typescript
// 在所有关键点添加日志
logger.debug('路径验证', {
  projectDir,
  projectDirType: typeof projectDir,
  projectDirLength: projectDir?.length,
  projectDirIsAbsolute: path.isAbsolute(projectDir || ''),
  relativePath,
  caller: new Error().stack.split('\n')[2]
});

// 添加断言
assert(projectDir, 'projectDir 不能为空');
assert.strictEqual(typeof projectDir, 'string', 'projectDir 必须是字符串');
assert(projectDir.length > 0, 'projectDir 不能是空字符串');
```

**捕获：** 在测试中，这一层帮助快速定位了剩余 5% 的边缘情况。

---

### 关键洞察

**所有四层都是必要的。**

在测试期间，每一层都捕获了其他层遗漏的 bug：

- **层级 1** 捕获了大部分明显的错误（50%）
- **层级 2** 捕获了配置和初始化问题（30%）
- **层级 3** 捕获了运行时边缘情况（15%）
- **层级 4** 帮助快速定位剩余问题（5%）

**如果只有一层防御，50-95% 的 bug 会漏掉。**

---

## 防御模式

### 模式 1: 参数验证

```typescript
function processData(data: unknown) {
  // 类型检查
  if (typeof data !== 'object' || data === null) {
    throw new TypeError('data 必须是对象');
  }

  // 必需字段检查
  const required = ['id', 'name', 'email'];
  for (const field of required) {
    if (!(field in data)) {
      throw new Error(`缺少必需字段: ${field}`);
    }
  }

  // 格式验证
  if (!isValidEmail(data.email)) {
    throw new Error('email 格式无效');
  }

  // 继续处理
}
```

---

### 模式 2: 状态验证

```typescript
class StatefulService {
  private initialized = false;
  private connected = false;

  async connect() {
    // 状态前置条件
    if (!this.initialized) {
      throw new Error('服务未初始化，请先调用 init()');
    }

    if (this.connected) {
      throw new Error('已经连接，不能重复连接');
    }

    // 执行连接
    await this.doConnect();
    this.connected = true;
  }

  async execute(command: string) {
    // 状态前置条件
    if (!this.initialized) {
      throw new Error('服务未初始化');
    }

    if (!this.connected) {
      throw new Error('服务未连接');
    }

    // 执行命令
    return await this.doExecute(command);
  }
}
```

---

### 模式 3: 边界检查

```typescript
function getArrayElement<T>(array: T[], index: number): T {
  // 参数验证
  if (!Array.isArray(array)) {
    throw new TypeError('第一个参数必须是数组');
  }

  if (typeof index !== 'number') {
    throw new TypeError('索引必须是数字');
  }

  // 边界检查
  if (index < 0) {
    throw new RangeError(`索引不能为负数: ${index}`);
  }

  if (index >= array.length) {
    throw new RangeError(`索引超出范围: ${index} >= ${array.length}`);
  }

  // 安全访问
  return array[index];
}
```

---

### 模式 4: 资源验证

```typescript
class FileProcessor {
  async processFile(filePath: string) {
    // 参数验证
    if (!filePath) {
      throw new Error('文件路径不能为空');
    }

    // 资源存在性检查
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    // 资源可访问性检查
    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
    } catch {
      throw new Error(`文件不可读: ${filePath}`);
    }

    // 资源类型检查
    const stats = await fs.promises.stat(filePath);
    if (!stats.isFile()) {
      throw new Error(`不是文件: ${filePath}`);
    }

    // 资源大小检查
    if (stats.size > 100 * 1024 * 1024) {
      throw new Error(`文件太大: ${stats.size} 字节`);
    }

    // 处理文件
    return await this.doProcessFile(filePath);
  }
}
```

---

## 何时使用每一层

### 层级 1: 入口点验证

**使用时机：**
- API 端点
- CLI 参数解析
- 用户输入处理
- 外部数据接收

**验证内容：**
- 必需字段存在
- 基本格式正确
- 类型正确

---

### 层级 2: 业务逻辑验证

**使用时机：**
- 服务层函数
- 业务规则执行
- 数据转换

**验证内容：**
- 业务规则满足
- 数据一致性
- 权限检查

---

### 层级 3: 环境守卫

**使用时机：**
- 数据库操作
- 文件系统访问
- 网络请求
- 外部服务调用

**验证内容：**
- 连接状态
- 资源可用性
- 环境配置

---

### 层级 4: 调试插桩

**使用时机：**
- 所有关键路径
- 复杂逻辑
- 容易出错的地方

**记录内容：**
- 输入参数
- 中间状态
- 输出结果
- 调用栈

---

## 常见错误

### ❌ 错误 1: 只在一个地方验证

```typescript
// ❌ 只在入口点验证
router.post('/api/users', (req, res) => {
  if (!req.body.email) {
    return res.status(400).json({ error: 'email 必需' });
  }
  // 假设下游不需要验证
  createUser(req.body);
});

// ❌ 下游没有防御
function createUser(data) {
  // 直接使用 data.email，假设已验证
  return db.insert('users', { email: data.email });
}
```

**问题：** 如果 `createUser` 被其他地方调用，没有验证。

---

### ❌ 错误 2: 假设上层已验证

```typescript
// ❌ 假设调用者已验证
function processEmail(email) {
  // 没有验证，假设 email 有效
  return email.toLowerCase().trim();
  // 如果 email 是 undefined，崩溃
}
```

**问题：** 防御性编程要求每个函数验证自己的输入。

---

### ❌ 错误 3: 验证不完整

```typescript
// ❌ 只检查存在性，不检查类型和格式
function setConfig(config) {
  if (!config.port) {
    throw new Error('port 必需');
  }
  // 没有检查 port 是否是数字
  // 没有检查 port 是否在有效范围内
  this.port = config.port;
}
```

**问题：** 不完整的验证仍然会导致错误。

---

## 记住

**防御深度原则：**

1. **不要信任任何输入** - 即使来自内部
2. **在多个层级验证** - 不要只在一个地方
3. **每层独立验证** - 不要假设上层已验证
4. **提供清晰的错误消息** - 帮助快速定位问题
5. **记录验证失败** - 用于监控和调试

**四层都是必要的：**
- 层级 1：保护系统入口
- 层级 2：执行业务规则
- 层级 3：保护关键操作
- 层级 4：帮助调试问题

**不要：**
- ❌ 只在一个地方验证
- ❌ 假设上层已验证
- ❌ 验证不完整
- ❌ 忽略边缘情况

**要：**
- ✅ 多层防御
- ✅ 独立验证
- ✅ 完整检查
- ✅ 详细日志

**现在开始构建防御深度。**
