/**
 * 命令系统 - CLI 和命令处理
 *
 * 负责：
 * - 命令行解析
 * - 命令注册和执行
 * - 帮助文档生成
 * - 命令结果输出
 */

import { Command } from 'commander';
import { Logger } from '../core/logger.js';

const logger = new Logger('Commands');

// 导出命令实现
export { AgentCommand, createAgentCommand } from './agent-command.js';
export { WorkflowCommand, createWorkflowCommand } from './workflow-command.js';

/**
 * 命令注册表
 */
export const commandRegistry = {
  agent: 'agent-command',
  workflow: 'workflow-command'
};

/**
 * 获取所有命令实例
 * @returns {Object} - 命令映射
 */
export function getAllCommands() {
  const { createAgentCommand } = await import('./agent-command.js');
  const { createWorkflowCommand } = await import('./workflow-command.js');

  return {
    agent: createAgentCommand(),
    workflow: createWorkflowCommand()
  };
}

/**
 * 初始化命令系统
 */
export async function initializeCommands() {
  try {
    logger.info('初始化命令系统...');

    // 命令系统初始化逻辑

    logger.info('命令系统初始化完成');
  } catch (error) {
    logger.error('命令系统初始化失败:', error);
    throw error;
  }
}

export class CommandRegistry {
  constructor() {
    this.program = new Command();
    this.commands = new Map();
  }

  register(name, description, action) {
    this.program
      .command(name)
      .description(description)
      .action(action);

    this.commands.set(name, { description, action });
    logger.info(`已注册命令: ${name}`);
  }

  async execute(args) {
    return this.program.parseAsync(args);
  }
}
