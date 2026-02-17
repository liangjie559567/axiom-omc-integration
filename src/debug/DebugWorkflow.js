class DebugWorkflow {
  constructor() {
    this.phases = ['observe', 'hypothesize', 'test', 'fix'];
    this.currentPhase = null;
  }

  start() {
    this.currentPhase = 'observe';
    return this.currentPhase;
  }

  next() {
    const idx = this.phases.indexOf(this.currentPhase);
    if (idx < this.phases.length - 1) {
      this.currentPhase = this.phases[idx + 1];
    }
    return this.currentPhase;
  }

  getPhase() {
    return this.currentPhase;
  }
}

export default DebugWorkflow;
