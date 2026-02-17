import Logger from '../Logger.js';

describe('Logger', () => {
  let logger;

  beforeEach(() => {
    logger = new Logger();
  });

  test('应记录日志', () => {
    logger.log('info', 'test message');
    expect(logger.getLogs()).toHaveLength(1);
  });

  test('应按级别过滤日志', () => {
    logger.log('info', 'info message');
    logger.log('error', 'error message');
    expect(logger.getLogs('info')).toHaveLength(1);
  });

  test('应清除日志', () => {
    logger.log('info', 'test');
    logger.clear();
    expect(logger.getLogs()).toHaveLength(0);
  });
});
