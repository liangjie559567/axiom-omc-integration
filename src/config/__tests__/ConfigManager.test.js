import ConfigManager from '../ConfigManager.js';

describe('ConfigManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ConfigManager();
  });

  test('应设置配置', () => {
    manager.set('key1', 'value1');
    expect(manager.get('key1')).toBe('value1');
  });

  test('应检查配置存在', () => {
    manager.set('key1', 'value1');
    expect(manager.has('key1')).toBe(true);
    expect(manager.has('key2')).toBe(false);
  });

  test('应清除配置', () => {
    manager.set('key1', 'value1');
    manager.clear();
    expect(manager.has('key1')).toBe(false);
  });
});
