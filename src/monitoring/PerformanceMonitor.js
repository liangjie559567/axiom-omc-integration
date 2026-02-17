class PerformanceMonitor {
  constructor() {
    this.metrics = [];
  }

  record(name, duration) {
    this.metrics.push({ name, duration, timestamp: Date.now() });
  }

  getMetrics(name) {
    return name ? this.metrics.filter(m => m.name === name) : this.metrics;
  }

  getAverage(name) {
    const filtered = this.getMetrics(name);
    if (filtered.length === 0) return 0;
    const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
    return sum / filtered.length;
  }

  clear() {
    this.metrics = [];
  }
}

export default PerformanceMonitor;
