import CacheManager from '../CacheManager.js';

describe('CacheManager', () => {
  let cache;

  beforeEach(() => {
    cache = new CacheManager();
  });

  test('应设置和获取缓存', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  test('应清除缓存', () => {
    cache.set('key1', 'value1');
    cache.clear();
    expect(cache.get('key1')).toBeNull();
  });
});
