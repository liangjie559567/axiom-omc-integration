import ExecutionModeManager from '../ExecutionModeManager.js';

describe('ExecutionModeManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ExecutionModeManager();
  });

  test('应正确启动模式', () => {
    const result = manager.startMode('autopilot');
    expect(result.started).toBe(true);
    expect(result.mode).toBe('autopilot');
    expect(manager.getActiveMode()).toBe('autopilot');
  });

  test('应拒绝无效模式', () => {
    const result = manager.startMode('invalid');
    expect(result.started).toBe(false);
  });

  test('应正确切换模式', () => {
    manager.startMode('autopilot');
    const switched = manager.switchMode('ralph');
    expect(switched).toBe(true);
    expect(manager.getActiveMode()).toBe('ralph');
  });
});
