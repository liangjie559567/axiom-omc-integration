class ValidationEngine {
  constructor() {
    this.rules = new Map();
  }

  addRule(name, validator) {
    this.rules.set(name, validator);
  }

  validate(name, data) {
    const validator = this.rules.get(name);
    if (!validator) return { valid: true };
    return validator(data);
  }

  clear() {
    this.rules.clear();
  }
}

export default ValidationEngine;
