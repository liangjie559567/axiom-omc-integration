/**
 * 向量搜索引擎
 * 使用 Vectra 实现高性能语义搜索（纯 JavaScript）
 */

import { LocalIndex } from 'vectra';
import { Logger } from '../core/logger.js';
import fs from 'fs/promises';
import path from 'path';

const logger = new Logger('VectorSearch');

/**
 * 向量搜索类
 */
export class VectorSearch {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {number} options.dimension - 向量维度（默认 384）
   * @param {string} options.indexPath - 索引存储路径
   */
  constructor(options = {}) {
    this.dimension = options.dimension || 384;
    this.indexPath = options.indexPath || '.agent/memory/vector-index';
    this.index = null;
    this.initialized = false;

    logger.info(`向量搜索引擎已初始化 (维度: ${this.dimension})`);
  }

  /**
   * 初始化索引
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // 确保索引目录存在
      await fs.mkdir(this.indexPath, { recursive: true });

      // 创建或加载索引
      this.index = new LocalIndex(this.indexPath);

      // 检查索引是否已创建
      const indexExists = await this.index.isIndexCreated();

      if (!indexExists) {
        // 创建新索引
        await this.index.createIndex();
        logger.info('创建新的向量索引');
      } else {
        logger.info('加载现有向量索引');
      }

      this.initialized = true;
      logger.success('向量搜索引擎初始化完成');

    } catch (error) {
      logger.error('初始化向量搜索引擎失败', error.message);
      throw error;
    }
  }

  /**
   * 添加单个向量
   * @param {string} id - 项目 ID
   * @param {Array<number>} embedding - 向量嵌入
   * @param {Object} metadata - 元数据
   * @returns {Promise<boolean>} - 是否成功
   */
  async addItem(id, embedding, metadata = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!Array.isArray(embedding) || embedding.length !== this.dimension) {
        throw new Error(`向量维度不匹配: 期望 ${this.dimension}, 实际 ${embedding.length}`);
      }

      // 添加到索引
      await this.index.insertItem({
        id,
        vector: embedding,
        metadata: {
          ...metadata,
          addedAt: new Date().toISOString()
        }
      });

      logger.debug(`已添加向量: ${id}`);
      return true;

    } catch (error) {
      logger.error(`添加向量失败: ${id}`, error.message);
      return false;
    }
  }

  /**
   * 批量添加向量
   * @param {Array<Object>} items - 项目数组 [{id, embedding, ...metadata}]
   * @returns {Promise<Object>} - {success: number, failed: number}
   */
  async addItems(items) {
    let success = 0;
    let failed = 0;

    for (const item of items) {
      const { id, embedding, ...metadata } = item;
      if (await this.addItem(id, embedding, metadata)) {
        success++;
      } else {
        failed++;
      }
    }

    logger.info(`批量添加完成: 成功 ${success}, 失败 ${failed}`);
    return { success, failed };
  }

  /**
   * 搜索相似向量
   * @param {Array<number>} queryEmbedding - 查询向量
   * @param {number} k - 返回结果数量（默认 5）
   * @returns {Promise<Array<Object>>} - 搜索结果 [{id, score, metadata}]
   */
  async search(queryEmbedding, k = 5) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!Array.isArray(queryEmbedding) || queryEmbedding.length !== this.dimension) {
        throw new Error(`查询向量维度不匹配: 期望 ${this.dimension}, 实际 ${queryEmbedding.length}`);
      }

      // 执行搜索
      const results = await this.index.queryItems(queryEmbedding, k);

      if (!results || results.length === 0) {
        logger.warn('索引为空或未找到结果');
        return [];
      }

      // 转换结果格式并限制数量（Vectra 可能返回超过 k 个结果）
      const formattedResults = results
        .slice(0, k)
        .map(result => ({
          id: result.item.id,
          score: result.score,
          similarity: result.score, // Vectra 返回的 score 就是相似度
          distance: 1 - result.score, // 距离 = 1 - 相似度
          metadata: result.item.metadata || {}
        }));

      logger.debug(`搜索完成: 找到 ${formattedResults.length} 个结果`);
      return formattedResults;

    } catch (error) {
      logger.error('搜索失败', error.message);
      return [];
    }
  }

  /**
   * 获取项目
   * @param {string} id - 项目 ID
   * @returns {Promise<Object|null>} - 项目数据
   */
  async getItem(id) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const item = await this.index.getItem(id);
      if (!item) {
        return null;
      }

      return {
        id: item.id,
        metadata: item.metadata || {}
      };

    } catch (error) {
      logger.error(`获取项目失败: ${id}`, error.message);
      return null;
    }
  }

  /**
   * 删除项目
   * @param {string} id - 项目 ID
   * @returns {Promise<boolean>} - 是否成功
   */
  async deleteItem(id) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // 先检查项目是否存在
      const item = await this.index.getItem(id);
      if (!item) {
        logger.warn(`项目不存在: ${id}`);
        return false;
      }

      await this.index.deleteItem(id);

      logger.debug(`已删除项目: ${id}`);
      return true;

    } catch (error) {
      logger.warn(`删除项目失败: ${id}`, error.message);
      return false;
    }
  }

  /**
   * 保存索引到文件
   * @returns {Promise<boolean>} - 是否成功
   */
  async save() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Vectra 会自动保存索引到磁盘
      logger.success(`索引已保存: ${this.indexPath}`);
      return true;

    } catch (error) {
      logger.error('保存索引失败', error.message);
      return false;
    }
  }

  /**
   * 从文件加载索引
   * @returns {Promise<boolean>} - 是否成功
   */
  async load() {
    try {
      // 初始化会自动加载索引
      await this.initialize();

      const items = await this.index.listItems();
      logger.success(`索引已加载: ${items ? items.length : 0} 个项目`);

      return true;

    } catch (error) {
      logger.error('加载索引失败', error.message);
      return false;
    }
  }

  /**
   * 获取统计信息
   * @returns {Promise<Object>} - 统计信息
   */
  async getStats() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const items = await this.index.listItems();

      return {
        dimension: this.dimension,
        currentElements: items ? items.length : 0,
        indexPath: this.indexPath,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
      };

    } catch (error) {
      logger.error('获取统计信息失败', error.message);
      return {
        dimension: this.dimension,
        currentElements: 0,
        indexPath: this.indexPath,
        memoryUsage: 0
      };
    }
  }

  /**
   * 清空索引
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // 删除所有项目
      const items = await this.index.listItems();
      if (items && items.length > 0) {
        for (const item of items) {
          await this.index.deleteItem(item.id);
        }
      }

      logger.info('索引已清空');

    } catch (error) {
      logger.error('清空索引失败', error.message);
      throw error;
    }
  }
}

/**
 * 创建向量搜索实例
 * @param {Object} options - 配置选项
 * @returns {VectorSearch} - 向量搜索实例
 */
export function createVectorSearch(options = {}) {
  return new VectorSearch(options);
}
