import ExecutionModeManager from '../ExecutionModeManager.js';

describe('ExecutionModeManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ExecutionModeManager();
  });

  test('应注册和启动模式', () => {
    manager.registerMode('autopilot', (cfg) => cfg.value);
    expect(manager.startMode('autopilot', { value: 'test' })).toBe('test');
    expect(manager.getActiveMode()).toBe('autopilot');
  });

  test('应停止模式', () => {
    manager.registerMode('autopilot', () => {});
    manager.startMode('autopilot', {});
    manager.stopMode();
    expect(manager.getActiveMode()).toBeNull();
  });
});
