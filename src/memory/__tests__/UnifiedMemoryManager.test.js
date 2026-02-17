import UnifiedMemoryManager from '../UnifiedMemoryManager.js';

describe('UnifiedMemoryManager', () => {
  let manager;

  beforeEach(() => {
    manager = new UnifiedMemoryManager();
  });

  test('应保存和加载上下文', () => {
    manager.saveContext('agent-1', { data: 'test' });
    const loaded = manager.loadContext('agent-1');
    expect(loaded.data).toBe('test');
    expect(loaded.timestamp).toBeDefined();
  });

  test('应添加和查询知识', () => {
    manager.addKnowledge('key1', 'value1');
    const result = manager.queryKnowledge('key1');
    expect(result.value).toBe('value1');
    expect(result.timestamp).toBeDefined();
  });

  test('应清空所有数据', () => {
    manager.saveContext('agent-1', { data: 'test' });
    manager.addKnowledge('key1', 'value1');
    manager.clear();
    expect(manager.loadContext('agent-1')).toBeUndefined();
    expect(manager.queryKnowledge('key1')).toBeUndefined();
  });
});
