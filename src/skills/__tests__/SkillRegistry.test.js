import SkillRegistry from '../SkillRegistry.js';

describe('SkillRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new SkillRegistry();
  });

  test('应正确注册技能', () => {
    const handler = () => 'test';
    registry.register('test-skill', handler);
    expect(registry.get('test-skill')).toBe(handler);
  });

  test('应返回技能列表', () => {
    registry.register('skill1', () => {});
    registry.register('skill2', () => {});
    expect(registry.list()).toHaveLength(2);
  });
});
