class ContextManager {
  constructor() {
    this.contexts = new Map();
  }

  set(key, value) {
    this.contexts.set(key, value);
  }

  get(key) {
    return this.contexts.get(key);
  }

  clear() {
    this.contexts.clear();
  }
}

export default ContextManager;
