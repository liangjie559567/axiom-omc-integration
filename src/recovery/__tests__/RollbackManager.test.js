import RollbackManager from '../RollbackManager.js';

describe('RollbackManager', () => {
  let manager;

  beforeEach(() => {
    manager = new RollbackManager();
  });

  test('应保存快照', () => {
    manager.saveSnapshot({ data: 'test' });
    expect(manager.canRollback()).toBe(true);
  });

  test('应回滚到上一个状态', () => {
    manager.saveSnapshot({ data: 'state1' });
    const state = manager.rollback();
    expect(state.data).toBe('state1');
  });
});
