import TransactionManager from '../TransactionManager.js';

describe('TransactionManager', () => {
  let manager;

  beforeEach(() => {
    manager = new TransactionManager();
  });

  test('应开始和提交事务', () => {
    manager.begin('tx1');
    manager.commit('tx1');
    expect(manager.getStatus('tx1')).toBe('committed');
  });

  test('应回滚事务', () => {
    manager.begin('tx1');
    manager.rollback('tx1');
    expect(manager.getStatus('tx1')).toBe('rolled_back');
  });
});
