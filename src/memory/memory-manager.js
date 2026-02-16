/**
 * 记忆管理系统
 * 
 * 功能：
 * - 决策记录（decision logs）
 * - 上下文存储（context storage）
 * - 记忆检索（memory retrieval）
 * - 记忆演化（pattern extraction）
 * - 知识图谱集成
 */

import fs from 'fs/promises';
import path from 'path';
import { VectorSearch } from './vector-search.js';
import { Logger } from '../core/logger.js';
import _ from 'lodash';

const logger = new Logger('MemoryManager');

/**
 * 记忆类型枚举
 */
export const MemoryType = {
  DECISION: 'decision',
  ARCHITECTURAL: 'architectural',
  TECHNICAL: 'technical',
  CONTEXT: 'context',
  PATTERN: 'pattern',
  KNOWLEDGE: 'knowledge'
};

/**
 * 记忆管理器类
 */
export class MemoryManager {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {string} options.dataDir - 数据存储目录
   * @param {number} options.vectorDimension - 向量维度（默认 1536，OpenAI embedding 维度）
   * @param {number} options.maxElements - 最大元素数量（默认 10000）
   */
  constructor(options = {}) {
    this.dataDir = options.dataDir || path.join(process.cwd(), '.agent', 'memory');
    this.vectorDimension = options.vectorDimension || 1536;
    this.maxElements = options.maxElements || 10000;
    
    // 内存存储
    this.memories = new Map();
    this.tags = new Map();
    this.categories = new Map();
    
    // 向量搜索索引
    this.vectorIndex = null;
    this.vectorIdMap = new Map(); // 映射记忆 ID 到向量索引
    
    // 初始化标志
    this.initialized = false;
  }

  /**
   * 初始化记忆管理器
   */
  async initialize() {
    if (this.initialized) {
      logger.warn('记忆管理器已初始化');
      return;
    }

    try {
      logger.info('初始化记忆管理器...');
      
      // 确保数据目录存在
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // 初始化向量索引
      this.vectorIndex = new VectorSearch({
        dimension: this.vectorDimension,
        indexPath: path.join(this.dataDir, 'vector-index')
      });
      await this.vectorIndex.initialize();
      
      // 加载现有数据
      await this._loadMemories();
      await this._loadVectorIndex();
      
      this.initialized = true;
      logger.info(`记忆管理器初始化完成，已加载 ${this.memories.size} 条记忆`);
    } catch (error) {
      logger.error('记忆管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 加载记忆数据
   * @private
   */
  async _loadMemories() {
    const memoriesFile = path.join(this.dataDir, 'memories.json');
    
    try {
      const data = await fs.readFile(memoriesFile, 'utf-8');
      const memoriesArray = JSON.parse(data);
      
      for (const memory of memoriesArray) {
        this.memories.set(memory.id, memory);
        
        // 构建标签索引
        if (memory.tags) {
          for (const tag of memory.tags) {
            if (!this.tags.has(tag)) {
              this.tags.set(tag, new Set());
            }
            this.tags.get(tag).add(memory.id);
          }
        }
        
        // 构建分类索引
        if (memory.type) {
          if (!this.categories.has(memory.type)) {
            this.categories.set(memory.type, new Set());
          }
          this.categories.get(memory.type).add(memory.id);
        }
      }
      
      logger.info(`已加载 ${memoriesArray.length} 条记忆`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.info('未找到现有记忆数据，将创建新文件');
      } else {
        throw error;
      }
    }
  }

  /**
   * 加载向量索引
   * @private
   */
  async _loadVectorIndex() {
    // VectorSearch 会自动加载索引
    const stats = await this.vectorIndex.getStats();

    // 重建 ID 映射：从已加载的记忆中恢复
    this.vectorIdMap = new Map();
    for (const [id, memory] of this.memories.entries()) {
      if (memory.embedding) {
        this.vectorIdMap.set(id, id);
      }
    }

    logger.info(`已加载向量索引，包含 ${stats.currentElements} 个向量`);
  }

  /**
   * 保存记忆数据
   * @private
   */
  async _saveMemories() {
    const memoriesFile = path.join(this.dataDir, 'memories.json');
    const memoriesArray = Array.from(this.memories.values());
    
    await fs.writeFile(
      memoriesFile,
      JSON.stringify(memoriesArray, null, 2),
      'utf-8'
    );
    
    logger.debug(`已保存 ${memoriesArray.length} 条记忆`);
  }

  /**
   * 保存向量索引
   * @private
   */
  async _saveVectorIndex() {
    // VectorSearch 会自动保存索引
    await this.vectorIndex.save();
    logger.debug(`已保存向量索引，包含 ${this.vectorIdMap.size} 个向量`);
  }

  /**
   * 添加记忆
   * @param {Object} memory - 记忆对象
   * @param {string} memory.content - 记忆内容
   * @param {string} memory.type - 记忆类型
   * @param {string} [memory.rationale] - 理由说明
   * @param {Array<string>} [memory.tags] - 标签列表
   * @param {Array<number>} [memory.embedding] - 向量嵌入
   * @returns {Object} - 添加的记忆对象
   */
  async addMemory(memory) {
    if (!this.initialized) {
      throw new Error('记忆管理器未初始化');
    }

    // 生成唯一 ID
    const id = this._generateId();
    const timestamp = new Date().toISOString();
    
    const newMemory = {
      id,
      timestamp,
      type: memory.type || MemoryType.CONTEXT,
      content: memory.content,
      rationale: memory.rationale || '',
      tags: memory.tags || [],
      embedding: memory.embedding || null,
      metadata: memory.metadata || {}
    };

    // 存储记忆
    this.memories.set(id, newMemory);
    
    // 更新标签索引
    for (const tag of newMemory.tags) {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag).add(id);
    }
    
    // 更新分类索引
    if (!this.categories.has(newMemory.type)) {
      this.categories.set(newMemory.type, new Set());
    }
    this.categories.get(newMemory.type).add(id);
    
    // 添加向量索引
    if (newMemory.embedding) {
      await this.vectorIndex.addItem(id, newMemory.embedding, {
        type: newMemory.type,
        timestamp: newMemory.timestamp
      });
      this.vectorIdMap.set(id, id); // 使用记忆 ID 作为向量 ID
    }
    
    // 持久化
    await this._saveMemories();
    if (newMemory.embedding) {
      await this._saveVectorIndex();
    }
    
    logger.info(`已添加记忆: ${id} (${newMemory.type})`);
    return newMemory;
  }

  /**
   * 获取记忆
   * @param {string} id - 记忆 ID
   * @returns {Object|null} - 记忆对象
   */
  getMemory(id) {
    return this.memories.get(id) || null;
  }

  /**
   * 删除记忆
   * @param {string} id - 记忆 ID
   * @returns {boolean} - 是否成功删除
   */
  async deleteMemory(id) {
    const memory = this.memories.get(id);
    if (!memory) {
      return false;
    }

    // 从标签索引中移除
    for (const tag of memory.tags) {
      const tagSet = this.tags.get(tag);
      if (tagSet) {
        tagSet.delete(id);
        if (tagSet.size === 0) {
          this.tags.delete(tag);
        }
      }
    }

    // 从分类索引中移除
    const categorySet = this.categories.get(memory.type);
    if (categorySet) {
      categorySet.delete(id);
      if (categorySet.size === 0) {
        this.categories.delete(memory.type);
      }
    }

    // 从向量索引中移除
    if (this.vectorIdMap.has(id)) {
      await this.vectorIndex.deleteItem(id);
      this.vectorIdMap.delete(id);
    }

    // 删除记忆
    this.memories.delete(id);

    // 持久化
    await this._saveMemories();

    logger.info(`已删除记忆: ${id}`);
    return true;
  }

  /**
   * 按标签搜索记忆
   * @param {Array<string>} tags - 标签列表
   * @param {Object} options - 搜索选项
   * @param {string} options.operator - 操作符 ('AND' 或 'OR')
   * @returns {Array<Object>} - 记忆列表
   */
  searchByTags(tags, options = {}) {
    const operator = options.operator || 'OR';
    let resultIds = new Set();

    if (operator === 'AND') {
      // 交集：所有标签都必须匹配
      const tagSets = tags.map(tag => this.tags.get(tag) || new Set());
      if (tagSets.length === 0) return [];
      
      resultIds = new Set(tagSets[0]);
      for (let i = 1; i < tagSets.length; i++) {
        resultIds = new Set([...resultIds].filter(id => tagSets[i].has(id)));
      }
    } else {
      // 并集：任一标签匹配即可
      for (const tag of tags) {
        const tagSet = this.tags.get(tag);
        if (tagSet) {
          tagSet.forEach(id => resultIds.add(id));
        }
      }
    }

    return Array.from(resultIds).map(id => this.memories.get(id));
  }

  /**
   * 按类型搜索记忆
   * @param {string} type - 记忆类型
   * @returns {Array<Object>} - 记忆列表
   */
  searchByType(type) {
    const categorySet = this.categories.get(type);
    if (!categorySet) return [];
    
    return Array.from(categorySet).map(id => this.memories.get(id));
  }

  /**
   * 向量搜索（语义搜索）
   * @param {Array<number>} queryVector - 查询向量
   * @param {number} k - 返回结果数量
   * @returns {Promise<Array<Object>>} - 搜索结果
   */
  async searchByVector(queryVector, k = 10) {
    if (!queryVector || queryVector.length !== this.vectorDimension) {
      throw new Error(`查询向量维度必须为 ${this.vectorDimension}`);
    }

    if (this.vectorIdMap.size === 0) {
      logger.warn('向量索引为空');
      return [];
    }

    try {
      const results = await this.vectorIndex.search(queryVector, k);

      return results.map(result => {
        const memory = this.memories.get(result.id);

        return {
          memory,
          distance: result.distance,
          similarity: result.similarity
        };
      }).filter(item => item.memory !== undefined);
    } catch (error) {
      logger.error('向量搜索失败:', error);
      return [];
    }
  }

  /**
   * 文本搜索（简单关键词匹配）
   * @param {string} query - 搜索查询
   * @param {Object} options - 搜索选项
   * @returns {Array<Object>} - 搜索结果
   */
  searchByText(query, options = {}) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    for (const memory of this.memories.values()) {
      const content = memory.content.toLowerCase();
      const rationale = (memory.rationale || '').toLowerCase();
      
      if (content.includes(lowerQuery) || rationale.includes(lowerQuery)) {
        results.push(memory);
      }
    }

    return results;
  }

  /**
   * 获取统计信息
   * @returns {Object} - 统计数据
   */
  getStats() {
    const typeStats = {};
    for (const [type, ids] of this.categories.entries()) {
      typeStats[type] = ids.size;
    }

    return {
      totalMemories: this.memories.size,
      totalTags: this.tags.size,
      totalVectors: this.vectorIdMap.size,
      typeDistribution: typeStats,
      topTags: this._getTopTags(10)
    };
  }

  /**
   * 获取最常用的标签
   * @param {number} limit - 返回数量
   * @returns {Array<Object>} - 标签统计
   * @private
   */
  _getTopTags(limit = 10) {
    const tagCounts = Array.from(this.tags.entries()).map(([tag, ids]) => ({
      tag,
      count: ids.size
    }));

    return _.orderBy(tagCounts, ['count'], ['desc']).slice(0, limit);
  }

  /**
   * 根据向量 ID 获取记忆 ID
   * @param {number} vectorId - 向量 ID
   * @returns {string|null} - 记忆 ID
   * @private
   */
  _getMemoryIdByVectorId(vectorId) {
    for (const [memoryId, vId] of this.vectorIdMap.entries()) {
      if (vId === vectorId) {
        return memoryId;
      }
    }
    return null;
  }

  /**
   * 生成唯一 ID
   * @returns {string} - 唯一 ID
   * @private
   */
  _generateId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `memory-${timestamp}-${random}`;
  }
}
