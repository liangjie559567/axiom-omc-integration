import SkillExecutor from '../SkillExecutor.js';

describe('SkillExecutor', () => {
  let executor;

  beforeEach(() => {
    executor = new SkillExecutor();
  });

  test('应正确执行技能', async () => {
    executor.registry.register('test', (args) => args * 2);
    const result = await executor.execute('test', 5);
    expect(result).toBe(10);
  });

  test('不存在的技能应抛出错误', async () => {
    await expect(executor.execute('unknown', {}))
      .rejects.toThrow('Skill not found');
  });

  test('应正确映射技能到模式', () => {
    const mode = executor.mapToMode('brainstorming');
    expect(mode).toBe('analyst');
  });
});
