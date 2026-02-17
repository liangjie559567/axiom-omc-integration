class ContextManager {
  constructor() {
    this.contexts = new Map();
  }

  save(id, context) {
    this.contexts.set(id, { ...context, savedAt: Date.now() });
  }

  load(id) {
    return this.contexts.get(id);
  }

  list() {
    return Array.from(this.contexts.keys());
  }
}

export default ContextManager;
