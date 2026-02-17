import ToolAdapter from '../ToolAdapter.js';

describe('ToolAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new ToolAdapter();
  });

  test('应注册工具', () => {
    adapter.register('tool1', async () => 'result');
    expect(adapter.list()).toContain('tool1');
  });

  test('应执行工具', async () => {
    adapter.register('tool1', async (p) => p * 2);
    const result = await adapter.execute('tool1', 5);
    expect(result).toBe(10);
  });

  test('未找到工具时抛出错误', async () => {
    await expect(adapter.execute('unknown', {}))
      .rejects.toThrow('Tool not found');
  });
});
