/**
 * 核心模块 - 系统基础功能
 * 
 * 负责：
 * - 系统初始化
 * - 配置管理
 * - 日志系统
 * - 错误处理
 */

import { Logger } from './logger.js';
import { ConfigManager } from './config.js';

const logger = new Logger('Core');
const configManager = new ConfigManager();

/**
 * 初始化核心模块
 */
export async function initializeCore() {
  try {
    logger.info('初始化核心模块...');
    
    // 加载配置
    await configManager.load();
    
    logger.info('核心模块初始化完成');
  } catch (error) {
    logger.error('核心模块初始化失败:', error);
    throw error;
  }
}

export { Logger, ConfigManager };
