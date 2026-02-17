import UnifiedMemoryManager from '../UnifiedMemoryManager.js';

describe('UnifiedMemoryManager', () => {
  let manager;

  beforeEach(() => {
    manager = new UnifiedMemoryManager();
  });

  test('应正确存储和检索记忆', () => {
    manager.store('key1', 'value1');
    expect(manager.retrieve('key1')).toBe('value1');
  });

  test('应列出所有记忆键', () => {
    manager.store('key1', 'value1');
    manager.store('key2', 'value2');
    expect(manager.list()).toEqual(['key1', 'key2']);
  });

  test('应正确清除记忆', () => {
    manager.store('key1', 'value1');
    manager.clear();
    expect(manager.retrieve('key1')).toBeUndefined();
  });
});
