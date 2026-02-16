## 项目上下文摘要（记忆管理系统实现）
生成时间：2026-02-17 10:30:00

### 1. 相似实现分析

- **实现1**: commands/memory-manager.js:13-232
  - 模式：Python 适配器模式（通过 execSync 调用 Python 脚本）
  - 可复用：临时文件处理模式、错误处理结构、JSON 序列化/反序列化
  - 需注意：依赖外部 Python 脚本，需要处理进程调用失败的情况

- **实现2**: src/memory/index.js:31-67
  - 模式：简单内存存储（Map 和 Array）
  - 可复用：基础的 CRUD 接口设计、简单文本搜索逻辑
  - 需注意：当前实现过于简单，缺少持久化、向量搜索、标签系统

- **实现3**: src/state/index.js:32-37
  - 模式：状态管理器（继承 EventEmitter）
  - 可复用：状态历史记录模式
  - 需注意：可以借鉴历史记录的设计思路

### 2. 项目约定

- **命名约定**:
  - 类名使用 PascalCase（如 MemoryManager）
  - 方法名使用 camelCase（如 recordDecision, searchKnowledge）
  - 私有属性无特殊前缀
  - 文件名使用 kebab-case（如 memory-manager.js）

- **文件组织**:
  - 核心实现放在 src/ 目录
  - 命令行适配器放在 commands/ 目录
  - 测试文件放在 tests/unit/ 目录
  - 使用 ES6 模块（type: "module"）

- **导入顺序**:
  1. Node.js 内置模块
  2. 第三方依赖
  3. 项目内部模块
  4. 相对路径导入

- **代码风格**:
  - 使用 2 空格缩进
  - 使用单引号
  - 使用 JSDoc 注释
  - 使用 async/await 而非 Promise.then()

### 3. 可复用组件清单

- `src/core/logger.js`: 日志工具（Logger 类）
- `hnswlib-node`: 向量搜索库（已在 package.json 中）
- `markdown-it`: Markdown 解析器（已在 package.json 中）
- `lodash`: 工具函数库（已在 package.json 中）
- 临时文件处理模式（来自 commands/memory-manager.js）
- 错误处理结构（统一返回格式：success, error, timestamp）

### 4. 测试策略

- **测试框架**: Jest（配置在 jest.config.js）
- **测试模式**: 单元测试（describe + it + expect）
- **参考文件**: tests/unit/memory.test.js
- **覆盖要求**:
  - 分支覆盖率 ≥ 80%
  - 函数覆盖率 ≥ 80%
  - 行覆盖率 ≥ 80%
  - 语句覆盖率 ≥ 80%
- **测试结构**:
  - beforeEach 初始化测试实例
  - 按功能模块分组（describe）
  - 测试正常流程 + 边界条件 + 错误处理

### 5. 依赖和集成点

- **外部依赖**:
  - `hnswlib-node`: 向量搜索（HNSW 算法）
  - `markdown-it`: Markdown 解析
  - `lodash`: 工具函数
  - `js-yaml`: YAML 解析

- **内部依赖**:
  - `src/core/logger.js`: 日志记录
  - 可能需要与 `src/state/index.js` 集成（状态持久化）

- **集成方式**:
  - 直接导入和实例化
  - 通过构造函数注入依赖

- **配置来源**:
  - 项目根目录的 config/ 目录
  - 可能需要 .agent/memory/ 目录存储数据

### 6. 技术选型理由

- **为什么用 JavaScript 重写**:
  - 统一技术栈（项目使用 Node.js）
  - 降低维护成本（避免 Python + JavaScript 混合）
  - 更好的集成性（直接使用 Node.js 生态）

- **为什么用 hnswlib-node**:
  - 高性能向量搜索（HNSW 算法）
  - 支持持久化
  - 成熟的 Node.js 绑定

- **优势**:
  - 纯 JavaScript 实现，无需外部进程
  - 更快的响应速度（无进程间通信开销）
  - 更好的错误处理和调试体验

- **劣势和风险**:
  - 需要重新实现 Python 版本的功能
  - 向量嵌入可能需要外部 API（如 OpenAI）
  - 大规模数据的性能需要验证

### 7. 关键风险点

- **并发问题**:
  - 多个操作同时写入记忆可能导致数据竞争
  - 需要实现锁机制或使用队列

- **边界条件**:
  - 空查询字符串
  - 无效的记忆 ID
  - 超大记忆数据（内存溢出）
  - 向量维度不匹配

- **性能瓶颈**:
  - 大规模向量搜索的性能
  - 记忆数据的持久化 I/O
  - 标签索引的查询效率

- **安全考虑**:
  - 记忆数据可能包含敏感信息
  - 需要验证输入数据（防止注入攻击）
  - 文件路径需要规范化（防止路径遍历）
