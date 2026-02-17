import KnowledgeGraph from '../KnowledgeGraph.js';

describe('KnowledgeGraph', () => {
  let graph;

  beforeEach(() => {
    graph = new KnowledgeGraph();
  });

  test('应添加和获取节点', () => {
    graph.addNode('node1', { name: 'test' });
    const node = graph.getNode('node1');
    expect(node.data.name).toBe('test');
  });

  test('应添加和查询边', () => {
    graph.addNode('node1', {});
    graph.addNode('node2', {});
    graph.addEdge('node1', 'node2', 'relates');
    const edges = graph.getEdges('node1');
    expect(edges.length).toBe(1);
    expect(edges[0].relation).toBe('relates');
  });

  test('应清空图谱', () => {
    graph.addNode('node1', {});
    graph.clear();
    expect(graph.getNode('node1')).toBeUndefined();
  });
});
