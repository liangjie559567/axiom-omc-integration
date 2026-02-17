class TDDCycle {
  constructor() {
    this.phases = ['RED', 'GREEN', 'REFACTOR'];
    this.currentPhase = null;
  }

  start() {
    this.currentPhase = 'RED';
    return this.currentPhase;
  }

  nextPhase() {
    const idx = this.phases.indexOf(this.currentPhase);
    if (idx < this.phases.length - 1) {
      this.currentPhase = this.phases[idx + 1];
    } else {
      this.currentPhase = 'RED';
    }
    return this.currentPhase;
  }

  validatePhase(phase) {
    return this.phases.includes(phase);
  }

  getCurrentPhase() {
    return this.currentPhase;
  }
}

export default TDDCycle;
