import ServiceRegistry from '../ServiceRegistry.js';

describe('ServiceRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new ServiceRegistry();
  });

  test('应注册和获取服务', () => {
    const service = { name: 'test' };
    registry.register('s1', service);
    expect(registry.get('s1')).toBe(service);
  });

  test('应注销服务', () => {
    registry.register('s1', {});
    registry.unregister('s1');
    expect(registry.get('s1')).toBeUndefined();
  });
});
