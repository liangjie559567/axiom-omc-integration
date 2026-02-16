/**
 * 日志系统单元测试
 */

import { jest } from '@jest/globals';
import { Logger } from '../../src/core/logger.js';

describe('Logger', () => {
  let logger;
  let consoleSpy;

  beforeEach(() => {
    logger = new Logger('Test');
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('应该创建带有命名空间的日志记录器', () => {
    expect(logger.namespace).toBe('Test');
  });

  it('应该记录信息', () => {
    logger.info('测试消息');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('应该记录警告', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    logger.warn('警告消息');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('应该记录错误', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    logger.error('错误消息');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
