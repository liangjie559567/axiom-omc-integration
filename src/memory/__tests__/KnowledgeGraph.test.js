import KnowledgeGraph from '../KnowledgeGraph.js';

describe('KnowledgeGraph', () => {
  let graph;

  beforeEach(() => {
    graph = new KnowledgeGraph();
  });

  test('应正确添加和查询节点', () => {
    graph.addNode('node1', { name: 'test' });
    const result = graph.query('node1');
    expect(result.name).toBe('test');
  });

  test('应正确添加边和查询关系', () => {
    graph.addNode('a', { name: 'A' });
    graph.addNode('b', { name: 'B' });
    graph.addEdge('a', 'b', 'relates');
    const related = graph.getRelated('a');
    expect(related).toHaveLength(1);
    expect(related[0].id).toBe('b');
  });
});
