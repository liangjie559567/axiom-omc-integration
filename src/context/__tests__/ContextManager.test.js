import ContextManager from '../ContextManager.js';

describe('ContextManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ContextManager();
  });

  test('应设置和获取上下文', () => {
    manager.set('key1', 'value1');
    expect(manager.get('key1')).toBe('value1');
  });

  test('应清除所有上下文', () => {
    manager.set('key1', 'value1');
    manager.clear();
    expect(manager.get('key1')).toBeUndefined();
  });
});
