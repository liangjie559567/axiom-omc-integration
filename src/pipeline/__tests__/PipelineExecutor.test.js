import PipelineExecutor from '../PipelineExecutor.js';

describe('PipelineExecutor', () => {
  let executor;

  beforeEach(() => {
    executor = new PipelineExecutor();
  });

  test('应执行管道阶段', async () => {
    executor.register('p1', [
      async (x) => x + 1,
      async (x) => x * 2
    ]);
    const result = await executor.execute('p1', 5);
    expect(result).toBe(12);
  });

  test('应记录阶段结果', async () => {
    executor.register('p1', [async (x) => x + 1]);
    await executor.execute('p1', 5);
    expect(executor.getResults('p1')).toEqual([6]);
  });
});
