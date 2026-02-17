# v3.0.2 - Brainstorming 工作流引导增强

## ✨ 新增功能

### 智能工作流推荐
- 🎯 需求澄清完成后自动推荐合适的工作流
- 📊 基于任务复杂度智能评估（简单/中等/复杂）
- 🌳 工作流决策树（直接实现/writing-plans/autopilot/ralph/team）

### 用户交互选项
- ✅ 选项 A：自动执行推荐工作流
- 🔀 选项 B：选择其他工作流（7种可选）
- 📋 选项 C：先规划再执行

### 用户回复处理
- 🚀 识别"开始"/"执行"触发自动执行
- 🎛️ 识别工作流名称触发指定工作流
- 📝 识别"先规划"触发规划流程
- 📄 决策记录到 operations-log.md

## 🎯 使用示例

### 示例 1：接受推荐
```
用户: 添加日志过滤功能
Claude: [需求澄清...] 推荐：直接实现
用户: 开始
Claude: ✅ 开始直接实现...
```

### 示例 2：选择工作流
```
用户: 重构认证系统
Claude: [需求澄清...] 推荐：team
用户: ralph
Claude: ✅ 使用 ralph 执行...
```

### 示例 3：先规划
```
用户: 实现支付功能
Claude: [需求澄清...] 推荐：writing-plans
用户: 先规划
Claude: ✅ 先制定详细计划...
```

## 📚 文档

- [完整实现报告](.claude/brainstorming-workflow-implementation.md)
- [测试报告](.claude/brainstorming-workflow-test.md)

## 📦 安装

```bash
npm install axiom-omc-integration@3.0.2
```

---

**完整更新日志**: [CHANGELOG.md](CHANGELOG.md)
