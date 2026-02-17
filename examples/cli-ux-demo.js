/**
 * CLI 用户体验优化演示
 */

import { Logger } from '../src/core/logger.js';
import { Interactive } from '../src/core/interactive.js';

// 演示增强的日志功能
async function demoLogger() {
  const logger = new Logger('Demo', { showTimestamp: true });

  console.log('\n=== 日志功能演示 ===\n');

  // 基础日志
  logger.info('这是一条信息日志');
  logger.warn('这是一条警告日志');
  logger.error('这是一条错误日志');
  logger.success('这是一条成功日志');

  console.log('\n--- 进度提示 ---\n');

  // 进度演示
  for (let i = 0; i <= 100; i += 20) {
    logger.progress('处理任务', i, 100);
    await sleep(500);
  }

  console.log('\n--- 实时操作反馈 ---\n');

  // 操作反馈
  logger.action('executor', '准备执行任务', 'running');
  await sleep(1000);
  logger.action('executor', '任务执行成功', 'success');
  await sleep(500);
  logger.action('debugger', '分析失败', 'failed');
}

// 演示交互式功能
async function demoInteractive() {
  console.log('\n=== 交互功能演示 ===\n');

  // 确认提示
  const confirmed = await Interactive.confirm('是否继续执行?', true);
  console.log('用户选择:', confirmed ? '是' : '否');

  // 选项选择
  const choice = await Interactive.select(
    '请选择操作模式:',
    ['自动模式', '手动模式', '调试模式']
  );
  console.log('用户选择:', choice);
}

// 工具函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 主函数
async function main() {
  await demoLogger();

  // 仅在非自动模式下运行交互演示
  if (!process.env.AUTO_MODE) {
    await demoInteractive();
  } else {
    console.log('\n=== 交互功能演示（自动模式跳过）===\n');
  }

  console.log('\n演示完成！\n');
}

main().catch(console.error);
