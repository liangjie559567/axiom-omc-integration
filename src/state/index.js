/**
 * 状态管理系统
 * 
 * 负责：
 * - 应用程序状态管理
 * - 状态持久化
 * - 状态同步
 * - 事件发射
 */

import { Logger } from '../core/logger.js';
import EventEmitter from 'events';

const logger = new Logger('State');

/**
 * 初始化状态管理系统
 */
export async function initializeState() {
  try {
    logger.info('初始化状态管理系统...');
    
    // 状态管理系统初始化逻辑
    
    logger.info('状态管理系统初始化完成');
  } catch (error) {
    logger.error('状态管理系统初始化失败:', error);
    throw error;
  }
}

export class StateManager extends EventEmitter {
  constructor() {
    super();
    this.state = {};
    this.history = [];
  }

  setState(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    
    this.history.push({
      timestamp: Date.now(),
      key,
      oldValue,
      newValue: value,
    });
    
    this.emit('stateChanged', { key, oldValue, newValue: value });
  }

  getState(key) {
    return this.state[key];
  }

  getAllState() {
    return { ...this.state };
  }

  getHistory(key = null) {
    if (key) {
      return this.history.filter((item) => item.key === key);
    }
    return this.history;
  }

  reset() {
    this.state = {};
    this.history = [];
    this.emit('stateReset');
  }
}
