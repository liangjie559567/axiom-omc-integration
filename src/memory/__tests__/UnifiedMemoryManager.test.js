import UnifiedMemoryManager from '../UnifiedMemoryManager.js';
import fs from 'fs/promises';
import path from 'path';

describe('UnifiedMemoryManager', () => {
  let manager;
  const testPath = '.agent/memory-test';

  beforeEach(() => {
    manager = new UnifiedMemoryManager(testPath);
  });

  afterEach(async () => {
    await fs.rm(testPath, { recursive: true, force: true });
  });

  test('应正确保存和加载上下文', async () => {
    const context = { data: 'test', value: 123 };
    await manager.saveContext('agent-1', context);
    const loaded = await manager.loadContext('agent-1');
    expect(loaded.data).toBe('test');
    expect(loaded.value).toBe(123);
  });

  test('不存在的上下文应返回null', async () => {
    const loaded = await manager.loadContext('non-existent');
    expect(loaded).toBeNull();
  });
});
