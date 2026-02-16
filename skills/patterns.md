# /patterns - 代码模式查询技能

## 描述

查询和展示已识别的代码模式，帮助开发者了解项目中使用的设计模式和最佳实践。

## 使用方式

```
/patterns
/patterns --type <模式类型>
/patterns --search <关键词>
```

## 参数

- 无参数 - 显示所有模式的概览
- `--type <模式类型>` - 筛选特定类型的模式
- `--search <关键词>` - 搜索包含关键词的模式

## 功能

此技能会执行以下操作：

1. **加载模式库** - 从 `.agent/knowledge/patterns.json` 加载已识别的模式
2. **过滤模式** - 根据类型或关键词筛选
3. **分组显示** - 按模式类型分组展示
4. **统计信息** - 显示模式数量和分布

## 支持的模式类型

### 设计模式 (design_pattern)

- **创建型模式** - Factory, Singleton, Builder, Prototype
- **结构型模式** - Adapter, Decorator, Proxy, Facade
- **行为型模式** - Observer, Strategy, Command, Iterator

### 架构模式 (architecture_pattern)

- **分层架构** - MVC, MVVM, MVP
- **微服务架构** - Service Mesh, API Gateway
- **事件驱动** - Event Sourcing, CQRS

### 最佳实践 (best_practice)

- **命名规范** - 变量命名、函数命名、类命名
- **错误处理** - Try-Catch, Error Boundary
- **日志记录** - Structured Logging, Log Levels
- **测试策略** - Unit Test, Integration Test, E2E Test

### 反模式 (anti_pattern)

- **代码坏味道** - God Object, Spaghetti Code
- **性能问题** - N+1 Query, Memory Leak
- **安全问题** - SQL Injection, XSS

## 示例

### 示例 1：查看所有模式

```
/patterns
```

输出：

```
🔍 查询代码模式...

找到 28 个模式:

📦 DESIGN_PATTERN (12 个):

  🔹 Factory Pattern
     描述: 工厂模式用于创建对象，隐藏创建逻辑
     位置: app/services/factory.py:45
     使用次数: 8
     置信度: 95.0%

  🔹 Singleton Pattern
     描述: 单例模式确保类只有一个实例
     位置: app/core/config.py:12
     使用次数: 3
     置信度: 98.0%

📦 ARCHITECTURE_PATTERN (8 个):

  🔹 MVC Pattern
     描述: 模型-视图-控制器架构模式
     位置: app/api/v1/
     使用次数: 15
     置信度: 92.0%

📦 BEST_PRACTICE (6 个):

  🔹 Dependency Injection
     描述: 依赖注入模式，提高代码可测试性
     位置: app/utils/db.py:23
     使用次数: 42
     置信度: 90.0%

📦 ANTI_PATTERN (2 个):

  🔹 God Object
     描述: 上帝对象反模式，类承担过多职责
     位置: app/legacy/old_service.py:100
     使用次数: 1
     置信度: 85.0%


📊 模式统计:
  - 总模式数: 28
  - 匹配模式数: 28
  - 模式类型数: 4

✅ 查询完成
```

### 示例 2：筛选设计模式

```
/patterns --type design_pattern
```

仅显示设计模式相关的模式。

### 示例 3：搜索关键词

```
/patterns --search factory
```

搜索包含 "factory" 关键词的模式。

### 示例 4：搜索特定实现

```
/patterns --search "依赖注入"
```

搜索依赖注入相关的模式。

## 模式信息

每个模式包含以下信息：

- **名称** - 模式名称
- **类型** - 模式类型（design_pattern, architecture_pattern, best_practice, anti_pattern）
- **描述** - 模式的简短描述
- **位置** - 模式在代码中的位置（文件路径:行号）
- **使用次数** - 模式在项目中的使用频率
- **置信度** - 模式识别的置信度（0-100%）

## 输出

模式查询结果包含：

- **模式列表** - 按类型分组的模式列表
- **模式详情** - 每个模式的详细信息
- **统计信息** - 总模式数、匹配模式数、模式类型数

## 注意事项

- 模式库由 `/evolve` 技能自动生成和更新
- 如果没有找到模式数据，需要先运行 `/evolve --extract-patterns`
- 每种类型最多显示 10 个模式，避免输出过长
- 置信度低于 80% 的模式可能需要人工验证

## 使用场景

### 1. 学习项目架构

新成员加入项目时，运行 `/patterns` 了解项目使用的设计模式和架构。

### 2. 代码审查

代码审查时，查询相关模式确保新代码遵循既有模式。

### 3. 重构参考

重构代码时，查询最佳实践模式作为参考。

### 4. 识别技术债务

查询反模式，识别需要重构的代码。

## 相关技能

- `/evolve` - 触发知识演化（更新模式库）
- `/knowledge` - 查询知识库
- `/reflect` - 生成反思报告
