class UnifiedMemoryManager {
  constructor() {
    this.contexts = new Map();
    this.knowledge = new Map();
  }

  saveContext(agentId, context) {
    this.contexts.set(agentId, { ...context, timestamp: Date.now() });
  }

  loadContext(agentId) {
    return this.contexts.get(agentId);
  }

  addKnowledge(key, value) {
    this.knowledge.set(key, { value, timestamp: Date.now() });
  }

  queryKnowledge(key) {
    return this.knowledge.get(key);
  }

  clear() {
    this.contexts.clear();
    this.knowledge.clear();
  }
}

export default UnifiedMemoryManager;
