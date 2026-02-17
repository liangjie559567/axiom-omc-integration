class ExecutionModeManager {
  constructor() {
    this.modes = new Map();
    this.activeMode = null;
  }

  registerMode(name, handler) {
    this.modes.set(name, handler);
  }

  startMode(name, config) {
    const handler = this.modes.get(name);
    if (!handler) return null;
    this.activeMode = name;
    return handler(config);
  }

  getActiveMode() {
    return this.activeMode;
  }

  stopMode() {
    this.activeMode = null;
  }
}

export default ExecutionModeManager;
