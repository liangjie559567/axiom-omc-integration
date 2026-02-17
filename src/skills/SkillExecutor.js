import SkillRegistry from './SkillRegistry.js';

class SkillExecutor {
  constructor() {
    this.registry = new SkillRegistry();
  }

  async execute(skillName, args) {
    const handler = this.registry.get(skillName);
    if (!handler) throw new Error(`Skill not found: ${skillName}`);
    return await handler(args);
  }
}

export default SkillExecutor;
