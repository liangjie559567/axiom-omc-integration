class SkillLoader {
  constructor() {
    this.skills = new Map();
  }

  load(name, skill) {
    this.skills.set(name, skill);
  }

  get(name) {
    return this.skills.get(name);
  }

  list() {
    return Array.from(this.skills.keys());
  }
}

export default SkillLoader;
