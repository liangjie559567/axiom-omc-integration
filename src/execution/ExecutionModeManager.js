class ExecutionModeManager {
  constructor() {
    this.modes = ['autopilot', 'ultrawork', 'ralph', 'pipeline'];
    this.activeMode = null;
  }

  startMode(mode) {
    if (this.modes.includes(mode)) {
      this.activeMode = mode;
      return { started: true, mode };
    }
    return { started: false };
  }

  switchMode(toMode) {
    if (this.modes.includes(toMode)) {
      this.activeMode = toMode;
      return true;
    }
    return false;
  }

  getActiveMode() {
    return this.activeMode;
  }
}

export default ExecutionModeManager;
