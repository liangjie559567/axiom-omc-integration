class IntegrationBridge {
  constructor() {
    this.connections = new Map();
  }

  connect(source, target) {
    this.connections.set(source, target);
  }

  getTarget(source) {
    return this.connections.get(source);
  }

  disconnect(source) {
    return this.connections.delete(source);
  }

  listConnections() {
    return Array.from(this.connections.entries());
  }
}

export default IntegrationBridge;
