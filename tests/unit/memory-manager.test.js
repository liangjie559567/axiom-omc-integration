/**
 * 记忆管理系统单元测试
 */

import { MemoryManager, MemoryType } from '../../src/memory/memory-manager.js';
import fs from 'fs/promises';
import path from 'path';

describe('MemoryManager', () => {
  let memoryManager;
  const testDataDir = path.join(process.cwd(), '.test-memory');

  beforeEach(async () => {
    // 创建测试实例
    memoryManager = new MemoryManager({
      dataDir: testDataDir,
      vectorDimension: 128, // 使用较小的维度以加快测试
      maxElements: 1000
    });
    
    await memoryManager.initialize();
  });

  afterEach(async () => {
    // 清理测试数据
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch (error) {
      // 忽略清理错误
    }
  });

  describe('初始化', () => {
    it('应该成功初始化', () => {
      expect(memoryManager.initialized).toBe(true);
      expect(memoryManager.memories.size).toBe(0);
    });

    it('应该创建数据目录', async () => {
      const stats = await fs.stat(testDataDir);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('添加记忆', () => {
    it('应该添加决策记忆', async () => {
      const memory = await memoryManager.addMemory({
        type: MemoryType.DECISION,
        content: '选择 JavaScript 重写 Axiom Python 工具',
        rationale: '降低维护成本，统一技术栈',
        tags: ['architecture', 'tech-debt']
      });

      expect(memory.id).toBeDefined();
      expect(memory.type).toBe(MemoryType.DECISION);
      expect(memory.content).toBe('选择 JavaScript 重写 Axiom Python 工具');
      expect(memory.tags).toEqual(['architecture', 'tech-debt']);
      expect(memoryManager.memories.size).toBe(1);
    });

    it('应该添加带向量的记忆', async () => {
      const embedding = new Array(128).fill(0).map(() => Math.random());
      
      const memory = await memoryManager.addMemory({
        type: MemoryType.TECHNICAL,
        content: '使用 hnswlib-node 实现向量搜索',
        tags: ['vector-search'],
        embedding
      });

      expect(memory.embedding).toEqual(embedding);
      expect(memoryManager.vectorIdMap.size).toBe(1);
    });

    it('应该自动生成时间戳', async () => {
      const memory = await memoryManager.addMemory({
        content: '测试记忆'
      });

      expect(memory.timestamp).toBeDefined();
      expect(new Date(memory.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('检索记忆', () => {
    it('应该通过 ID 获取记忆', async () => {
      const added = await memoryManager.addMemory({
        content: '测试内容'
      });

      const retrieved = memoryManager.getMemory(added.id);
      expect(retrieved).toEqual(added);
    });

    it('应该返回 null 当记忆不存在', () => {
      const result = memoryManager.getMemory('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('删除记忆', () => {
    it('应该删除记忆', async () => {
      const memory = await memoryManager.addMemory({
        content: '待删除的记忆',
        tags: ['test']
      });

      const deleted = await memoryManager.deleteMemory(memory.id);
      expect(deleted).toBe(true);
      expect(memoryManager.memories.size).toBe(0);
      expect(memoryManager.getMemory(memory.id)).toBeNull();
    });

    it('应该清理标签索引', async () => {
      const memory = await memoryManager.addMemory({
        content: '测试',
        tags: ['tag1', 'tag2']
      });

      await memoryManager.deleteMemory(memory.id);
      expect(memoryManager.tags.has('tag1')).toBe(false);
      expect(memoryManager.tags.has('tag2')).toBe(false);
    });

    it('应该返回 false 当记忆不存在', async () => {
      const deleted = await memoryManager.deleteMemory('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('按标签搜索', () => {
    beforeEach(async () => {
      await memoryManager.addMemory({
        content: '记忆1',
        tags: ['tag1', 'tag2']
      });
      await memoryManager.addMemory({
        content: '记忆2',
        tags: ['tag2', 'tag3']
      });
      await memoryManager.addMemory({
        content: '记忆3',
        tags: ['tag3']
      });
    });

    it('应该使用 OR 操作符搜索', () => {
      const results = memoryManager.searchByTags(['tag1', 'tag3']);
      expect(results.length).toBe(3);
    });

    it('应该使用 AND 操作符搜索', () => {
      const results = memoryManager.searchByTags(['tag2', 'tag3'], { operator: 'AND' });
      expect(results.length).toBe(1);
      expect(results[0].content).toBe('记忆2');
    });

    it('应该返回空数组当标签不存在', () => {
      const results = memoryManager.searchByTags(['non-existent-tag']);
      expect(results).toEqual([]);
    });
  });

  describe('按类型搜索', () => {
    beforeEach(async () => {
      await memoryManager.addMemory({
        type: MemoryType.DECISION,
        content: '决策1'
      });
      await memoryManager.addMemory({
        type: MemoryType.DECISION,
        content: '决策2'
      });
      await memoryManager.addMemory({
        type: MemoryType.TECHNICAL,
        content: '技术记录'
      });
    });

    it('应该按类型搜索记忆', () => {
      const decisions = memoryManager.searchByType(MemoryType.DECISION);
      expect(decisions.length).toBe(2);
      
      const technical = memoryManager.searchByType(MemoryType.TECHNICAL);
      expect(technical.length).toBe(1);
    });

    it('应该返回空数组当类型不存在', () => {
      const results = memoryManager.searchByType('non-existent-type');
      expect(results).toEqual([]);
    });
  });

  describe('文本搜索', () => {
    beforeEach(async () => {
      await memoryManager.addMemory({
        content: 'JavaScript 是一门编程语言',
        rationale: '用于 Web 开发'
      });
      await memoryManager.addMemory({
        content: 'Python 也是编程语言',
        rationale: '用于数据科学'
      });
    });

    it('应该搜索内容', () => {
      const results = memoryManager.searchByText('JavaScript');
      expect(results.length).toBe(1);
      expect(results[0].content).toContain('JavaScript');
    });

    it('应该搜索理由说明', () => {
      const results = memoryManager.searchByText('数据科学');
      expect(results.length).toBe(1);
      expect(results[0].rationale).toContain('数据科学');
    });

    it('应该不区分大小写', () => {
      const results = memoryManager.searchByText('javascript');
      expect(results.length).toBe(1);
    });

    it('应该返回空数组当无匹配', () => {
      const results = memoryManager.searchByText('Rust');
      expect(results).toEqual([]);
    });
  });

  describe('向量搜索', () => {
    it('应该进行向量搜索', async () => {
      const embedding1 = new Array(128).fill(0).map(() => Math.random());
      const embedding2 = new Array(128).fill(0).map(() => Math.random());
      
      await memoryManager.addMemory({
        content: '记忆1',
        embedding: embedding1
      });
      await memoryManager.addMemory({
        content: '记忆2',
        embedding: embedding2
      });

      const queryVector = embedding1.map(v => v + 0.01); // 相似向量
      const results = await memoryManager.searchByVector(queryVector, 2);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].memory).toBeDefined();
      expect(results[0].similarity).toBeDefined();
    });

    it('应该抛出错误当向量维度不匹配', async () => {
      const wrongVector = new Array(64).fill(0);

      await expect(
        memoryManager.searchByVector(wrongVector)
      ).rejects.toThrow();
    });

    it('应该返回空数组当索引为空', async () => {
      const queryVector = new Array(128).fill(0);
      const results = await memoryManager.searchByVector(queryVector);

      expect(results).toEqual([]);
    });
  });

  describe('统计信息', () => {
    beforeEach(async () => {
      await memoryManager.addMemory({
        type: MemoryType.DECISION,
        content: '决策1',
        tags: ['tag1', 'tag2']
      });
      await memoryManager.addMemory({
        type: MemoryType.TECHNICAL,
        content: '技术1',
        tags: ['tag1']
      });
      await memoryManager.addMemory({
        type: MemoryType.TECHNICAL,
        content: '技术2',
        tags: ['tag3'],
        embedding: new Array(128).fill(0)
      });
    });

    it('应该返回统计信息', () => {
      const stats = memoryManager.getStats();
      
      expect(stats.totalMemories).toBe(3);
      expect(stats.totalTags).toBe(3);
      expect(stats.totalVectors).toBe(1);
      expect(stats.typeDistribution[MemoryType.DECISION]).toBe(1);
      expect(stats.typeDistribution[MemoryType.TECHNICAL]).toBe(2);
    });

    it('应该返回最常用标签', () => {
      const stats = memoryManager.getStats();
      
      expect(stats.topTags).toBeDefined();
      expect(stats.topTags.length).toBeGreaterThan(0);
      expect(stats.topTags[0].tag).toBe('tag1');
      expect(stats.topTags[0].count).toBe(2);
    });
  });

  describe('持久化', () => {
    it('应该保存和加载记忆', async () => {
      // 添加记忆
      await memoryManager.addMemory({
        type: MemoryType.DECISION,
        content: '测试持久化',
        tags: ['test']
      });

      // 创建新实例并加载
      const newManager = new MemoryManager({
        dataDir: testDataDir,
        vectorDimension: 128,
        maxElements: 1000
      });
      await newManager.initialize();

      expect(newManager.memories.size).toBe(1);
      const memory = Array.from(newManager.memories.values())[0];
      expect(memory.content).toBe('测试持久化');
      expect(memory.tags).toEqual(['test']);
    });

    it('应该保存和加载向量索引', async () => {
      const embedding = new Array(128).fill(0).map(() => Math.random());
      
      await memoryManager.addMemory({
        content: '向量测试',
        embedding
      });

      // 创建新实例并加载
      const newManager = new MemoryManager({
        dataDir: testDataDir,
        vectorDimension: 128,
        maxElements: 1000
      });
      await newManager.initialize();

      expect(newManager.vectorIdMap.size).toBe(1);
    });

    it('应该处理空数据目录', async () => {
      const emptyDir = path.join(process.cwd(), '.test-empty');
      
      const newManager = new MemoryManager({
        dataDir: emptyDir,
        vectorDimension: 128,
        maxElements: 1000
      });
      
      await expect(newManager.initialize()).resolves.not.toThrow();
      expect(newManager.memories.size).toBe(0);
      
      // 清理
      await fs.rm(emptyDir, { recursive: true, force: true });
    });
  });

  describe('边界条件', () => {
    it('应该处理空内容', async () => {
      const memory = await memoryManager.addMemory({
        content: ''
      });
      
      expect(memory.content).toBe('');
    });

    it('应该处理空标签数组', async () => {
      const memory = await memoryManager.addMemory({
        content: '测试',
        tags: []
      });
      
      expect(memory.tags).toEqual([]);
    });

    it('应该在未初始化时抛出错误', async () => {
      const uninitializedManager = new MemoryManager({
        dataDir: path.join(process.cwd(), '.test-uninit')
      });
      
      await expect(
        uninitializedManager.addMemory({ content: '测试' })
      ).rejects.toThrow('记忆管理器未初始化');
    });
  });
});
