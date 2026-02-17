import SessionManager from '../SessionManager.js';

describe('SessionManager', () => {
  let manager;

  beforeEach(() => {
    manager = new SessionManager();
  });

  test('应创建和获取会话', () => {
    manager.create('s1', { user: 'test' });
    expect(manager.get('s1').data).toEqual({ user: 'test' });
  });

  test('应销毁会话', () => {
    manager.create('s1', {});
    manager.destroy('s1');
    expect(manager.get('s1')).toBeUndefined();
  });
});
