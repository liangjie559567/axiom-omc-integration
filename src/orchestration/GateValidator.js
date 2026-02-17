class GateValidator {
  constructor() {
    this.rules = new Map();
  }

  addRule(stage, validator) {
    this.rules.set(stage, validator);
  }

  async validate(stage, context) {
    const validator = this.rules.get(stage);
    if (!validator) return { valid: true };
    return await validator(context);
  }
}

export default GateValidator;
