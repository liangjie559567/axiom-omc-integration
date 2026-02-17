class ConfigManager {
  constructor() {
    this.config = new Map();
  }

  set(key, value) {
    this.config.set(key, value);
  }

  get(key) {
    return this.config.get(key);
  }

  has(key) {
    return this.config.has(key);
  }

  clear() {
    this.config.clear();
  }
}

export default ConfigManager;
