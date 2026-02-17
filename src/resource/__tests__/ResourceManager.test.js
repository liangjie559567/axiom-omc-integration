import ResourceManager from '../ResourceManager.js';

describe('ResourceManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ResourceManager();
  });

  test('应分配和获取资源', () => {
    manager.allocate('r1', { data: 'test' });
    expect(manager.get('r1')).toEqual({ data: 'test' });
  });

  test('应释放资源', () => {
    manager.allocate('r1', { data: 'test' });
    manager.release('r1');
    expect(manager.get('r1')).toEqual({ data: 'test' });
  });
});
