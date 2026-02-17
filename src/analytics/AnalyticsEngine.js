class AnalyticsEngine {
  constructor() {
    this.data = [];
  }

  track(event, properties) {
    this.data.push({ event, properties, timestamp: Date.now() });
  }

  query(event) {
    return this.data.filter(d => d.event === event);
  }

  clear() {
    this.data = [];
  }
}

export default AnalyticsEngine;
