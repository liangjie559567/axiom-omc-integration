import SyncCoordinator from '../SyncCoordinator.js';

describe('SyncCoordinator', () => {
  let coordinator;

  beforeEach(() => {
    coordinator = new SyncCoordinator();
  });

  test('应注册和执行同步', () => {
    coordinator.register('sync1', (data) => data * 2);
    expect(coordinator.sync('sync1', 5)).toBe(10);
    expect(coordinator.getStatus('sync1')).toBe('completed');
  });

  test('应跟踪同步状态', () => {
    coordinator.register('sync1', () => {});
    expect(coordinator.getStatus('sync1')).toBe('idle');
  });
});
