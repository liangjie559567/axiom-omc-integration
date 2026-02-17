import SkillLoader from '../SkillLoader.js';

describe('SkillLoader', () => {
  let loader;

  beforeEach(() => {
    loader = new SkillLoader();
  });

  test('应加载技能', () => {
    loader.load('skill1', () => 'test');
    expect(loader.list()).toContain('skill1');
  });

  test('应获取技能', () => {
    const skill = () => 'result';
    loader.load('skill1', skill);
    expect(loader.get('skill1')).toBe(skill);
  });
});
