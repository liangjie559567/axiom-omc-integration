/**
 * 向量搜索引擎单元测试
 */

import { VectorSearch, createVectorSearch } from '../../src/memory/vector-search.js';
import fs from 'fs/promises';
import path from 'path';

describe('VectorSearch', () => {
  let vectorSearch;
  const testDimension = 128; // 使用较小的维度进行测试
  const testIndexPath = path.join(process.cwd(), 'tests', 'temp', 'test-vector-index');

  beforeEach(async () => {
    vectorSearch = new VectorSearch({
      dimension: testDimension,
      indexPath: testIndexPath
    });
    await vectorSearch.initialize();
  });

  afterEach(async () => {
    try {
      await vectorSearch.clear();
      await fs.rm(testIndexPath, { recursive: true, force: true });
    } catch (error) {
      // 忽略清理错误
    }
  });

  describe('构造函数', () => {
    it('应该使用默认参数初始化', () => {
      const vs = new VectorSearch();
      expect(vs.dimension).toBe(384);
      expect(vs.indexPath).toBe('.agent/memory/vector-index');
    });

    it('应该使用自定义参数初始化', () => {
      const vs = new VectorSearch({
        dimension: 256,
        indexPath: '/custom/path'
      });

      expect(vs.dimension).toBe(256);
      expect(vs.indexPath).toBe('/custom/path');
    });
  });

  describe('initialize', () => {
    it('应该成功初始化索引', async () => {
      const vs = new VectorSearch({
        dimension: testDimension,
        indexPath: path.join(testIndexPath, 'init-test')
      });

      await vs.initialize();
      expect(vs.initialized).toBe(true);
    });

    it('应该只初始化一次', async () => {
      await vectorSearch.initialize();
      await vectorSearch.initialize(); // 第二次调用应该直接返回
      expect(vectorSearch.initialized).toBe(true);
    });
  });

  describe('addItem', () => {
    it('应该添加单个向量', async () => {
      const embedding = new Array(testDimension).fill(0).map(() => Math.random());
      const result = await vectorSearch.addItem('test-1', embedding, { type: 'test' });

      expect(result).toBe(true);

      const stats = await vectorSearch.getStats();
      expect(stats.currentElements).toBe(1);
    });

    it('应该存储元数据', async () => {
      const embedding = new Array(testDimension).fill(0).map(() => Math.random());
      await vectorSearch.addItem('test-1', embedding, { type: 'test', value: 42 });

      const item = await vectorSearch.getItem('test-1');
      expect(item).not.toBeNull();
      expect(item.metadata.type).toBe('test');
      expect(item.metadata.value).toBe(42);
      expect(item.metadata.addedAt).toBeDefined();
    });

    it('应该在维度不匹配时返回 false', async () => {
      const wrongEmbedding = new Array(64).fill(0);
      const result = await vectorSearch.addItem('test-1', wrongEmbedding);

      expect(result).toBe(false);
    });

    it('应该在向量无效时返回 false', async () => {
      const result = await vectorSearch.addItem('test-1', 'not an array');
      expect(result).toBe(false);
    });
  });

  describe('addItems', () => {
    it('应该批量添加向量', async () => {
      const items = [];
      for (let i = 0; i < 10; i++) {
        items.push({
          id: `test-${i}`,
          embedding: new Array(testDimension).fill(0).map(() => Math.random()),
          type: 'test',
          index: i
        });
      }

      const result = await vectorSearch.addItems(items);

      expect(result.success).toBe(10);
      expect(result.failed).toBe(0);

      const stats = await vectorSearch.getStats();
      expect(stats.currentElements).toBe(10);
    });

    it('应该处理部分失败', async () => {
      const items = [
        {
          id: 'test-1',
          embedding: new Array(testDimension).fill(0).map(() => Math.random())
        },
        {
          id: 'test-2',
          embedding: new Array(64).fill(0) // 错误的维度
        },
        {
          id: 'test-3',
          embedding: new Array(testDimension).fill(0).map(() => Math.random())
        }
      ];

      const result = await vectorSearch.addItems(items);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(1);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      // 添加测试数据
      for (let i = 0; i < 5; i++) {
        const embedding = new Array(testDimension).fill(0).map(() => Math.random());
        await vectorSearch.addItem(`test-${i}`, embedding, { index: i });
      }
    });

    it('应该搜索相似向量', async () => {
      const queryEmbedding = new Array(testDimension).fill(0).map(() => Math.random());
      const results = await vectorSearch.search(queryEmbedding, 3);

      expect(results.length).toBeLessThanOrEqual(3);
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('score');
      expect(results[0]).toHaveProperty('similarity');
      expect(results[0]).toHaveProperty('distance');
      expect(results[0]).toHaveProperty('metadata');
    });

    it('应该返回正确数量的结果', async () => {
      const queryEmbedding = new Array(testDimension).fill(0).map(() => Math.random());
      const results = await vectorSearch.search(queryEmbedding, 2);

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('应该在索引为空时返回空数组', async () => {
      await vectorSearch.clear();
      const queryEmbedding = new Array(testDimension).fill(0).map(() => Math.random());
      const results = await vectorSearch.search(queryEmbedding);

      expect(results).toEqual([]);
    });

    it('应该在查询向量维度不匹配时返回空数组', async () => {
      const wrongEmbedding = new Array(64).fill(0);
      const results = await vectorSearch.search(wrongEmbedding);

      expect(results).toEqual([]);
    });

    it('应该计算相似度和距离', async () => {
      const queryEmbedding = new Array(testDimension).fill(0).map(() => Math.random());
      const results = await vectorSearch.search(queryEmbedding, 3);

      for (const result of results) {
        expect(result.similarity).toBeGreaterThanOrEqual(0);
        expect(result.similarity).toBeLessThanOrEqual(1);
        expect(result.distance).toBeGreaterThanOrEqual(0);
        expect(result.distance).toBeLessThanOrEqual(1);
        expect(result.similarity).toBeCloseTo(1 - result.distance, 5);
      }
    });
  });

  describe('getItem', () => {
    it('应该获取项目', async () => {
      const embedding = new Array(testDimension).fill(0).map(() => Math.random());
      await vectorSearch.addItem('test-1', embedding, { type: 'test' });

      const item = await vectorSearch.getItem('test-1');
      expect(item).not.toBeNull();
      expect(item.metadata.type).toBe('test');
    });

    it('应该在项目不存在时返回 null', async () => {
      const item = await vectorSearch.getItem('nonexistent');
      expect(item).toBeNull();
    });
  });

  describe('deleteItem', () => {
    it('应该删除项目', async () => {
      const embedding = new Array(testDimension).fill(0).map(() => Math.random());
      await vectorSearch.addItem('test-1', embedding);

      const result = await vectorSearch.deleteItem('test-1');
      expect(result).toBe(true);

      const item = await vectorSearch.getItem('test-1');
      expect(item).toBeNull();
    });

    it('应该在项目不存在时返回 false', async () => {
      const result = await vectorSearch.deleteItem('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('save 和 load', () => {
    it('应该保存索引', async () => {
      // 添加测试数据
      for (let i = 0; i < 5; i++) {
        const embedding = new Array(testDimension).fill(0).map(() => Math.random());
        await vectorSearch.addItem(`test-${i}`, embedding, { index: i });
      }

      const result = await vectorSearch.save();
      expect(result).toBe(true);
    });

    it('应该加载索引', async () => {
      // 先保存
      for (let i = 0; i < 5; i++) {
        const embedding = new Array(testDimension).fill(0).map(() => Math.random());
        await vectorSearch.addItem(`test-${i}`, embedding, { index: i });
      }
      await vectorSearch.save();

      // 创建新实例并加载
      const newVectorSearch = new VectorSearch({
        dimension: testDimension,
        indexPath: testIndexPath
      });
      const result = await newVectorSearch.load();

      expect(result).toBe(true);

      const stats = await newVectorSearch.getStats();
      expect(stats.currentElements).toBe(5);

      // 验证数据完整性
      const item = await newVectorSearch.getItem('test-0');
      expect(item).not.toBeNull();
      expect(item.metadata.index).toBe(0);
    });
  });

  describe('getStats', () => {
    it('应该返回统计信息', async () => {
      const stats = await vectorSearch.getStats();

      expect(stats).toHaveProperty('dimension');
      expect(stats).toHaveProperty('currentElements');
      expect(stats).toHaveProperty('indexPath');
      expect(stats).toHaveProperty('memoryUsage');

      expect(stats.currentElements).toBe(0);
      expect(stats.dimension).toBe(testDimension);
    });

    it('应该反映当前元素数量', async () => {
      const embedding = new Array(testDimension).fill(0).map(() => Math.random());
      await vectorSearch.addItem('test-1', embedding);

      const stats = await vectorSearch.getStats();
      expect(stats.currentElements).toBe(1);
    });
  });

  describe('clear', () => {
    it('应该清空索引', async () => {
      // 添加数据
      for (let i = 0; i < 5; i++) {
        const embedding = new Array(testDimension).fill(0).map(() => Math.random());
        await vectorSearch.addItem(`test-${i}`, embedding);
      }

      let stats = await vectorSearch.getStats();
      expect(stats.currentElements).toBe(5);

      // 清空
      await vectorSearch.clear();

      stats = await vectorSearch.getStats();
      expect(stats.currentElements).toBe(0);

      const item = await vectorSearch.getItem('test-0');
      expect(item).toBeNull();
    });
  });

  describe('createVectorSearch', () => {
    it('应该创建向量搜索实例', () => {
      const vs = createVectorSearch({ dimension: 256 });

      expect(vs).toBeInstanceOf(VectorSearch);
      expect(vs.dimension).toBe(256);
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内完成搜索', async () => {
      // 添加 50 个向量（减少数量以加快测试）
      for (let i = 0; i < 50; i++) {
        const embedding = new Array(testDimension).fill(0).map(() => Math.random());
        await vectorSearch.addItem(`test-${i}`, embedding);
      }

      const queryEmbedding = new Array(testDimension).fill(0).map(() => Math.random());

      const startTime = Date.now();
      const results = await vectorSearch.search(queryEmbedding, 10);
      const duration = Date.now() - startTime;

      expect(results.length).toBeLessThanOrEqual(10);
      expect(duration).toBeLessThan(500); // 应该在 500ms 内完成
    });
  });
});
