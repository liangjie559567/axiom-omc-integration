import SkillRegistry from './SkillRegistry.js';

class SkillExecutor {
  constructor() {
    this.registry = new SkillRegistry();
    this.modeMap = {
      'brainstorming': 'analyst',
      'writing-plans': 'planner',
      'executing-plans': 'executor',
      'test-driven-development': 'test-engineer'
    };
  }

  async execute(skillName, args) {
    const handler = this.registry.get(skillName);
    if (!handler) throw new Error(`Skill not found: ${skillName}`);
    return await handler(args);
  }

  mapToMode(skillName) {
    return this.modeMap[skillName];
  }
}

export default SkillExecutor;
