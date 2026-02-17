class SkillRegistry {
  constructor() {
    this.skills = new Map();
  }

  register(name, handler) {
    this.skills.set(name, handler);
  }

  get(name) {
    return this.skills.get(name);
  }

  list() {
    return Array.from(this.skills.keys());
  }
}

export default SkillRegistry;
