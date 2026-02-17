class KnowledgeGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  addNode(id, data) {
    this.nodes.set(id, data);
  }

  addEdge(from, to, type) {
    const key = `${from}->${to}`;
    this.edges.set(key, { from, to, type });
  }

  query(nodeId) {
    return this.nodes.get(nodeId);
  }

  getRelated(nodeId) {
    const related = [];
    for (const [key, edge] of this.edges) {
      if (edge.from === nodeId) {
        related.push({ id: edge.to, type: edge.type });
      }
    }
    return related;
  }
}

export default KnowledgeGraph;
