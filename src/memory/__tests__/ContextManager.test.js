import ContextManager from '../ContextManager.js';

describe('ContextManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ContextManager();
  });

  test('应正确保存和加载上下文', () => {
    manager.save('ctx1', { data: 'test' });
    expect(manager.load('ctx1').data).toBe('test');
  });

  test('应列出所有上下文', () => {
    manager.save('ctx1', {});
    manager.save('ctx2', {});
    expect(manager.list()).toEqual(['ctx1', 'ctx2']);
  });
});
