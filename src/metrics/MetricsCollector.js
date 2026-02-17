class MetricsCollector {
  constructor() {
    this.metrics = new Map();
  }

  record(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name).push({ value, timestamp: Date.now() });
  }

  get(name) {
    return this.metrics.get(name) || [];
  }

  clear() {
    this.metrics.clear();
  }
}

export default MetricsCollector;
