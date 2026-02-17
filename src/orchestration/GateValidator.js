class GateValidator {
  constructor() {
    this.rules = new Map();
  }

  addRule(stage, validator) {
    this.rules.set(stage, validator);
  }

  validate(stage, context) {
    const validator = this.rules.get(stage);
    if (!validator) return true;
    return validator(context);
  }

  clear() {
    this.rules.clear();
  }
}

export default GateValidator;
