class UnifiedMemoryManager {
  constructor() {
    this.memories = new Map();
  }

  store(key, value) {
    this.memories.set(key, { value, timestamp: Date.now() });
    return true;
  }

  retrieve(key) {
    return this.memories.get(key)?.value;
  }

  clear() {
    this.memories.clear();
  }

  list() {
    return Array.from(this.memories.keys());
  }
}

export default UnifiedMemoryManager;
