import KnowledgeGraph from '../KnowledgeGraph.js';

describe('KnowledgeGraph', () => {
  let graph;

  beforeEach(() => {
    graph = new KnowledgeGraph();
  });

  test('应正确添加节点', () => {
    graph.addNode('node1', { name: 'test' });
    expect(graph.query('node1')).toEqual({ name: 'test' });
  });

  test('应正确添加边', () => {
    graph.addNode('node1', {});
    graph.addNode('node2', {});
    graph.addEdge('node1', 'node2', 'relates');
    expect(graph.getEdges('node1')).toHaveLength(1);
  });
});
