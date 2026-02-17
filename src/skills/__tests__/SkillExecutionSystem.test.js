import SkillExecutionSystem from '../SkillExecutionSystem.js';

describe('SkillExecutionSystem', () => {
  let system;

  beforeEach(() => {
    system = new SkillExecutionSystem();
  });

  test('应加载和执行技能', () => {
    system.loadSkill('test', (ctx) => ctx.value * 2);
    expect(system.executeSkill('test', { value: 5 })).toBe(10);
  });

  test('应列出所有技能', () => {
    system.loadSkill('skill1', () => {});
    system.loadSkill('skill2', () => {});
    expect(system.listSkills()).toEqual(['skill1', 'skill2']);
  });
});
