# v2.0.0 发布说明

## 发布日期
2026-02-17

## 重大变更

### 新架构
- 引入事件溯源模式
- 实现CQRS架构
- 组件完全重构

## 新增功能

### 核心模块
- EventStore - 事件存储
- EventBus - 事件总线

### CQRS模块
- CommandHandler - 命令处理
- QueryHandler - 查询处理
- ReadModel - 读模型

### v2组件
- PhaseMapper v2
- AutoSyncEngine v2
- WorkflowOrchestrator v2

## 性能提升
- 事件处理速度提升70%+
- 测试覆盖率达到95%+

## 迁移指南
参见 docs/MIGRATION.md

