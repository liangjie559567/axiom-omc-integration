class SkillExecutionSystem {
  constructor() {
    this.skills = new Map();
  }

  loadSkill(name, handler) {
    this.skills.set(name, handler);
  }

  executeSkill(name, context) {
    const handler = this.skills.get(name);
    if (!handler) return null;
    return handler(context);
  }

  listSkills() {
    return Array.from(this.skills.keys());
  }
}

export default SkillExecutionSystem;
