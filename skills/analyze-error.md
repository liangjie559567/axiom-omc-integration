# /analyze-error - 错误分析与已知问题查询

## 描述

智能分析错误信息，自动查询知识库中的已知问题和解决方案，提供详细的错误诊断、根因分析和修复建议。

## 功能特性

- 🔍 智能错误解析（堆栈跟踪、错误类型、上下文）
- 📚 自动查询已知问题库（历史错误、解决方案）
- 🎯 根因分析（定位错误源头）
- 💡 修复建议（代码示例、配置调整）
- 📊 相似错误聚类（发现模式）
- 🔗 关联问题追踪（依赖错误、连锁反应）

## 使用方式

```bash
# 基础用法
/analyze-error "TypeError: Cannot read property 'name' of undefined"

# 分析完整堆栈跟踪
/analyze-error "$(cat error.log)"

# 指定错误类型
/analyze-error "数据库连接失败" --type database

# 查询相似错误
/analyze-error "API 超时" --similar
```

## 参数说明

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| 错误信息 | string | ✅ | - | 错误消息或堆栈跟踪 |
| --type | string | ❌ | auto | 错误类型（auto/syntax/runtime/database/network） |
| --similar | boolean | ❌ | false | 查询相似错误 |
| --fix | boolean | ❌ | true | 提供修复建议 |
| --context | string | ❌ | - | 额外上下文信息 |

## 分析流程

### 1. 错误解析
- 提取错误类型（TypeError, SyntaxError, RuntimeError 等）
- 解析堆栈跟踪（文件路径、行号、函数调用链）
- 识别错误上下文（变量值、环境信息）

### 2. 知识库查询
- 搜索历史相似错误（基于向量相似度）
- 匹配已知问题模式（正则表达式、关键词）
- 检索解决方案记录

### 3. 根因分析
- 定位错误源头（代码逻辑、配置错误、依赖问题）
- 分析错误传播路径
- 识别潜在的连锁错误

### 4. 修复建议
- 提供代码修复示例
- 建议配置调整
- 推荐最佳实践

## 输出示例

```markdown
# 错误分析报告

**分析时间**: 2026-02-16 16:00:00
**错误类型**: TypeError
**严重程度**: 🔴 高

## 1. 错误摘要

```
TypeError: Cannot read property 'name' of undefined
    at getUserName (src/services/user_service.py:45)
    at processUser (src/api/v1/endpoints/users.py:120)
    at handleRequest (src/middleware/request_handler.py:78)
```

**错误描述**: 尝试访问 undefined 对象的 'name' 属性

## 2. 根因分析

### 2.1 直接原因
- 变量 `user` 在 `getUserName` 函数中为 `undefined`
- 可能原因：数据库查询返回空结果，但未进行空值检查

### 2.2 错误传播路径
```
数据库查询 → 返回 None → 未检查空值 → 访问属性 → TypeError
```

### 2.3 影响范围
- 影响模块：用户服务模块
- 影响 API：`GET /api/v1/users/{id}`
- 影响用户：所有访问不存在用户的请求

## 3. 已知问题匹配

### 匹配度：95%
**问题 ID**: #2024-11-15-001
**标题**: 用户查询未检查空值导致 TypeError
**解决方案**: 在访问用户属性前添加空值检查

**历史出现次数**: 3 次
**最后出现时间**: 2024-11-15
**修复状态**: ✅ 已修复（但此处未应用）

## 4. 修复建议

### 4.1 立即修复（推荐）

**修改文件**: `src/services/user_service.py:45`

```python
# 修复前
def getUserName(user_id):
    user = db.query(User).filter(User.id == user_id).first()
    return user.name  # ❌ 未检查 user 是否为 None

# 修复后
def getUserName(user_id):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:  # ✅ 添加空值检查
        raise ValueError(f"User {user_id} not found")
    return user.name
```

### 4.2 防御性编程（最佳实践）

```python
def getUserName(user_id):
    user = db.query(User).filter(User.id == user_id).first()
    return user.name if user else None  # 使用三元表达式
```

### 4.3 使用 Optional 类型提示

```python
from typing import Optional

def getUserName(user_id: int) -> Optional[str]:
    user = db.query(User).filter(User.id == user_id).first()
    return user.name if user else None
```

## 5. 相似错误

找到 5 个相似错误：

1. **AttributeError: 'NoneType' object has no attribute 'email'**
   - 文件：`src/services/auth_service.py:89`
   - 相似度：92%
   - 解决方案：添加空值检查

2. **TypeError: Cannot read property 'id' of undefined**
   - 文件：`src/api/v1/endpoints/resources.py:156`
   - 相似度：88%
   - 解决方案：使用 Optional 类型

3. **KeyError: 'user_id'**
   - 文件：`src/services/session_service.py:67`
   - 相似度：75%
   - 解决方案：使用 dict.get() 方法

## 6. 预防措施

### 6.1 代码审查检查点
- ✅ 所有数据库查询后检查空值
- ✅ 使用 Optional 类型提示
- ✅ 添加单元测试覆盖空值场景

### 6.2 静态分析规则
- 启用 mypy 类型检查
- 配置 pylint 检查空值访问
- 使用 bandit 检查安全问题

### 6.3 测试用例
```python
def test_getUserName_with_invalid_id():
    """测试不存在的用户 ID"""
    with pytest.raises(ValueError):
        getUserName(999999)
```

## 7. 行动计划

| 优先级 | 任务 | 负责人 | 预计时间 |
|--------|------|--------|----------|
| P0 | 修复 getUserName 函数 | Backend | 10 分钟 |
| P1 | 添加单元测试 | Backend | 20 分钟 |
| P1 | 修复相似错误（5 处） | Backend | 1 小时 |
| P2 | 启用静态分析 | DevOps | 30 分钟 |

---

**分析完成时间**: 2026-02-16 16:01:30
**总耗时**: 90 秒
**置信度**: 95%
```

## 错误类型支持

### 语法错误（Syntax Errors）
- SyntaxError
- IndentationError
- TabError

### 运行时错误（Runtime Errors）
- TypeError
- ValueError
- AttributeError
- KeyError
- IndexError
- ZeroDivisionError

### 数据库错误（Database Errors）
- OperationalError
- IntegrityError
- DataError
- ProgrammingError

### 网络错误（Network Errors）
- ConnectionError
- TimeoutError
- HTTPError

### 自定义错误（Custom Errors）
- 业务逻辑错误
- 验证错误
- 权限错误

## 知识库集成

错误分析会自动查询以下知识源：

1. **项目历史错误库**
   - 位置：`.omc/knowledge/errors.json`
   - 包含：历史错误、解决方案、出现频率

2. **代码模式库**
   - 位置：`.omc/knowledge/patterns.json`
   - 包含：常见错误模式、最佳实践

3. **外部知识源**
   - Stack Overflow（通过 API）
   - GitHub Issues（相关项目）
   - 官方文档（框架、库）

## 故障排查

**问题：错误分析失败，提示"无法解析错误信息"**
- 提供完整的错误堆栈跟踪
- 使用 `--context` 参数提供额外上下文
- 检查错误信息格式是否正确

**问题：未找到相似错误**
- 知识库可能为空（首次使用）
- 使用 `/evolve` 命令触发知识演化
- 手动添加错误记录到知识库

**问题：修复建议不适用**
- 提供更多上下文信息（`--context`）
- 指定错误类型（`--type`）
- 查看相似错误的解决方案

## 相关命令

- `/evolve` - 触发知识演化，更新错误库
- `/knowledge` - 查询知识库
- `/patterns` - 查看代码模式库

## 技术实现

错误分析使用以下技术：
- **错误解析**: 正则表达式 + AST 分析
- **知识库查询**: Faiss 向量搜索 + 关键词匹配
- **根因分析**: 依赖图分析 + 调用链追踪
- **修复建议**: GPT-4o 代码生成

## 注意事项

⚠️ **重要**：
- 错误分析需要 OpenAI API 密钥（用于生成修复建议）
- 首次使用时知识库可能为空，建议先运行 `/evolve`
- 分析时间取决于错误复杂度（通常 10-60 秒）

## 版本历史

- **1.0.0** (2026-02-16): 初始版本，支持基础错误分析
