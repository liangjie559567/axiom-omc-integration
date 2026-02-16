# 开发指南

## 开发环境设置

### 前置要求

- Node.js >= 18.0.0
- npm 或 yarn
- Git

### 安装步骤

```bash
# 克隆仓库
git clone <repository-url>
cd axiom-omc-integration

# 安装依赖
npm install

# 验证安装
npm test
```

## 开发工作流

### 1. 创建功能分支

```bash
git checkout -b feature/your-feature-name
```

### 2. 开发代码

遵循以下规范：

- **命名约定**：使用 camelCase 命名变量和函数
- **文件组织**：按功能模块组织文件
- **代码注释**：为复杂逻辑添加注释
- **错误处理**：使用 try-catch 处理异常

### 3. 编写测试

```bash
# 运行测试
npm test

# 运行特定测试
npm test -- memory.test.js

# 生成覆盖率报告
npm test -- --coverage
```

### 4. 代码检查和格式化

```bash
# 检查代码风格
npm run lint

# 自动修复风格问题
npm run format
```

### 5. 提交更改

```bash
git add .
git commit -m "feat: 添加新功能"
git push origin feature/your-feature-name
```

## 代码规范

### JavaScript 风格指南

#### 变量声明

```javascript
// ✓ 好
const maxRetries = 3;
let currentAttempt = 0;

// ✗ 不好
var max_retries = 3;
```

#### 函数定义

```javascript
// ✓ 好
async function fetchData(url) {
  try {
    const response = await fetch(url);
    return response.json();
  } catch (error) {
    logger.error('获取数据失败', error);
    throw error;
  }
}

// ✗ 不好
function fetch_data(url) {
  // 没有错误处理
}
```

#### 注释

```javascript
// ✓ 好
/**
 * 计算两个数的和
 * @param {number} a - 第一个数
 * @param {number} b - 第二个数
 * @returns {number} 两数之和
 */
function add(a, b) {
  return a + b;
}

// ✗ 不好
// 这个函数计算和
function add(a, b) {
  return a + b;
}
```

### 模块结构

每个模块应包含：

```
src/module/
├── index.js          # 主入口，导出公共 API
├── core.js           # 核心实现
├── utils.js          # 模块内工具函数
└── types.js          # 类型定义（如果需要）
```

## 测试编写指南

### 单元测试示例

```javascript
describe('MemoryManager', () => {
  let memory;

  beforeEach(() => {
    memory = new MemoryManager();
  });

  it('应该添加对话', () => {
    memory.addConversation('conv1', { role: 'user', content: '你好' });
    const conv = memory.getConversation('conv1');
    expect(conv).toHaveLength(1);
  });
});
```

### 测试最佳实践

1. **一个测试一个概念**：每个测试只测试一个功能
2. **清晰的测试名称**：使用 "应该..." 的格式
3. **AAA 模式**：Arrange（准备）→ Act（执行）→ Assert（断言）
4. **避免测试间依赖**：每个测试应独立运行

## 调试技巧

### 启用调试模式

```bash
DEBUG=* npm start
```

### 使用 Node.js 调试器

```bash
node --inspect src/index.js
```

然后在 Chrome 中访问 `chrome://inspect`

### 日志记录

```javascript
import { Logger } from './core/logger.js';

const logger = new Logger('MyModule');
logger.debug('调试信息');
logger.info('信息');
logger.warn('警告');
logger.error('错误');
```

## 常见问题

### Q: 如何添加新的依赖？

```bash
npm install package-name
```

然后在代码中导入使用。

### Q: 如何运行特定的测试？

```bash
npm test -- --testNamePattern="MemoryManager"
```

### Q: 如何生成 API 文档？

目前使用 JSDoc 注释，可以使用 jsdoc 工具生成 HTML 文档：

```bash
npm install -g jsdoc
jsdoc -c jsdoc.json
```

## 性能优化

### 识别性能瓶颈

```javascript
import { formatTime } from './utils/index.js';

const start = Date.now();
// 执行操作
const elapsed = Date.now() - start;
console.log(`操作耗时: ${formatTime(elapsed)}`);
```

### 常见优化技巧

1. **缓存结果**：避免重复计算
2. **异步处理**：使用 async/await 处理 I/O
3. **批量操作**：减少循环次数
4. **内存管理**：及时释放大对象

## 发布流程

1. 更新版本号（package.json）
2. 更新 CHANGELOG
3. 创建 Git tag
4. 发布到 npm（如果适用）

```bash
npm version patch  # 或 minor, major
npm publish
```
