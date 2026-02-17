import PluginManager from '../PluginManager.js';

describe('PluginManager', () => {
  let manager;

  beforeEach(() => {
    manager = new PluginManager();
  });

  test('应加载插件', () => {
    manager.load('plugin1', { name: 'test' });
    expect(manager.get('plugin1')).toEqual({ name: 'test' });
  });

  test('应卸载插件', () => {
    manager.load('plugin1', {});
    expect(manager.unload('plugin1')).toBe(true);
    expect(manager.get('plugin1')).toBeUndefined();
  });

  test('应列出插件', () => {
    manager.load('plugin1', {});
    manager.load('plugin2', {});
    expect(manager.list()).toEqual(['plugin1', 'plugin2']);
  });
});
