class TDDValidator {
  constructor() {
    this.phases = ['red', 'green', 'refactor'];
  }

  validate(phase, context) {
    if (!this.phases.includes(phase)) {
      return { valid: false, error: 'Invalid TDD phase' };
    }
    return { valid: true, phase };
  }

  enforceTestFirst(hasTests) {
    return hasTests ? { valid: true } : { valid: false, error: 'Tests required first' };
  }
}

export default TDDValidator;
