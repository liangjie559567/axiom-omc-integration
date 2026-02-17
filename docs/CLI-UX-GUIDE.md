# CLI 用户体验优化指南

## 概述

v3.0.1 版本对命令行交互体验进行了全面优化，新增了进度提示、实时反馈和交互式确认功能。

---

## 新增功能

### 1. 增强的日志系统

#### 时间戳和级别标识

```javascript
import { Logger } from './src/core/logger.js';

const logger = new Logger('MyApp', {
  showTimestamp: true,  // 显示时间戳（默认 true）
  showLevel: true       // 显示日志级别（默认 true）
});

logger.info('应用启动');
// 输出: 14:30:25 [INFO] [MyApp] 应用启动
```

#### 进度提示

```javascript
// 显示任务进度
logger.progress('处理文件', 50, 100);
// 输出: [MyApp] 处理文件 ██████████░░░░░░░░░░ 50%
```

#### 实时操作反馈

```javascript
// 显示 Agent 操作状态
logger.action('executor', '执行代码', 'running');  // ⚙ [executor] 执行代码
logger.action('executor', '执行成功', 'success');  // ✓ [executor] 执行成功
logger.action('debugger', '分析失败', 'failed');   // ✗ [debugger] 分析失败
```

---

### 2. 交互式确认

#### 确认提示

```javascript
import { Interactive } from './src/core/interactive.js';

// 询问用户确认
const confirmed = await Interactive.confirm('确认删除文件?', false);
if (confirmed) {
  // 执行删除操作
}
```

#### 选项选择

```javascript
// 让用户选择选项
const mode = await Interactive.select(
  '请选择执行模式:',
  ['自动模式', '手动模式', '调试模式']
);
console.log('用户选择:', mode);
```

---

## 环境变量

### NO_CONFIRM

禁用交互式确认提示：

```bash
NO_CONFIRM=1 node your-script.js
```

### DEBUG

启用调试日志：

```bash
DEBUG=1 node your-script.js
```

---

## 向后兼容

所有原有功能保持不变，新功能为可选增强：

```javascript
// 原有方法仍然可用
logger.info('消息');
logger.warn('警告');
logger.error('错误');
logger.success('成功');
logger.debug('调试');
```

---

## 运行演示

```bash
node examples/cli-ux-demo.js
```
