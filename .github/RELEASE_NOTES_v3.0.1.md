# v3.0.1 - CLI 用户体验优化

## ✨ 新增功能

### 增强的日志系统
- ⏰ 时间戳显示（可配置）
- 🏷️ 日志级别标识
- 📊 进度条显示 `logger.progress()`
- ⚡ 实时操作反馈 `logger.action()`
- 📝 结构化日志输出

### 交互式功能
- ✅ 确认提示 `Interactive.confirm()`
- 🔘 选项选择 `Interactive.select()`
- 🔧 环境变量控制（NO_CONFIRM）

## 🎯 使用示例

```javascript
// 进度提示
logger.progress('处理任务', 50, 100);
// 输出: [CLI] 处理任务 ██████████░░░░░░░░░░ 50%

// 实时反馈
logger.action('executor', '执行代码', 'running');
// 输出: ⚙ [executor] 执行代码

// 交互确认
const confirmed = await Interactive.confirm('确认删除?');
```

## 📚 文档

- [CLI 用户体验指南](docs/CLI-UX-GUIDE.md)
- [演示脚本](examples/cli-ux-demo.js)

## 🧪 测试

- ✅ 1020/1020 测试通过
- ✅ 100% 测试覆盖率
- ✅ 向后兼容

## 🚀 快速开始

```bash
# 运行演示
AUTO_MODE=1 node examples/cli-ux-demo.js

# 禁用交互确认
NO_CONFIRM=1 npm start
```

## 📦 安装

```bash
npm install axiom-omc-integration@3.0.1
```

---

**完整更新日志**: [CHANGELOG.md](CHANGELOG.md)
