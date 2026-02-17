class KnowledgeGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
  }

  addNode(id, data) {
    this.nodes.set(id, data);
  }

  addEdge(from, to, type) {
    this.edges.push({ from, to, type });
  }

  query(nodeId) {
    return this.nodes.get(nodeId);
  }

  getEdges(nodeId) {
    return this.edges.filter(e => e.from === nodeId || e.to === nodeId);
  }
}

export default KnowledgeGraph;
