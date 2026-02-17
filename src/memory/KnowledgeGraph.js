class KnowledgeGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  addNode(id, data) {
    this.nodes.set(id, { id, data, timestamp: Date.now() });
  }

  getNode(id) {
    return this.nodes.get(id);
  }

  addEdge(from, to, relation) {
    const key = `${from}->${to}`;
    this.edges.set(key, { from, to, relation, timestamp: Date.now() });
  }

  getEdges(nodeId) {
    return Array.from(this.edges.values()).filter(
      e => e.from === nodeId || e.to === nodeId
    );
  }

  clear() {
    this.nodes.clear();
    this.edges.clear();
  }
}

export default KnowledgeGraph;
