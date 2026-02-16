/**
 * 知识图谱管理器
 * 构建和管理项目知识图谱
 */

import { EventEmitter } from 'events';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { Logger } from './logger.js';
import { generateId } from '../utils/index.js';

const logger = new Logger('KnowledgeGraph');

/**
 * 节点类型枚举
 */
export const NodeType = {
  CONCEPT: 'concept',
  FILE: 'file',
  FUNCTION: 'function',
  CLASS: 'class',
  MODULE: 'module',
  DECISION: 'decision',
  PATTERN: 'pattern'
};

/**
 * 关系类型枚举
 */
export const RelationType = {
  DEPENDS_ON: 'depends_on',
  IMPLEMENTS: 'implements',
  USES: 'uses',
  RELATED_TO: 'related_to',
  PART_OF: 'part_of',
  DERIVED_FROM: 'derived_from',
  CONFLICTS_WITH: 'conflicts_with'
};

/**
 * 知识图谱管理器类
 */
export class KnowledgeGraph extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} config - 配置选项
   */
  constructor(config = {}) {
    super();

    this.config = {
      storageDir: config.storageDir || '.omc/memory',
      graphFile: config.graphFile || 'knowledge-graph.json',
      autoSave: config.autoSave !== false,
      maxNodes: config.maxNodes || 10000,
      maxEdges: config.maxEdges || 50000,
      ...config
    };

    // 节点存储
    this.nodes = new Map();

    // 边存储
    this.edges = new Map();

    // 索引
    this.nodesByType = new Map();
    this.edgesByType = new Map();

    // 统计信息
    this.stats = {
      totalNodes: 0,
      totalEdges: 0,
      nodesByType: {},
      edgesByType: {}
    };

    logger.info('知识图谱管理器已初始化');
  }

  /**
   * 初始化（加载数据）
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      await this._loadGraph();

      logger.info('知识图谱初始化完成', {
        nodes: this.nodes.size,
        edges: this.edges.size
      });

      this.emit('initialized');
    } catch (error) {
      logger.error('初始化失败', error);
      throw error;
    }
  }

  /**
   * 添加节点
   * @param {Object} node - 节点信息
   * @returns {string} - 节点 ID
   */
  addNode(node) {
    const id = node.id || generateId();

    const record = {
      id,
      type: node.type || NodeType.CONCEPT,
      name: node.name,
      description: node.description || '',
      properties: node.properties || {},
      tags: node.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.nodes.set(id, record);
    this.stats.totalNodes++;

    // 更新索引
    if (!this.nodesByType.has(record.type)) {
      this.nodesByType.set(record.type, new Set());
    }
    this.nodesByType.get(record.type).add(id);

    // 更新统计
    this.stats.nodesByType[record.type] = (this.stats.nodesByType[record.type] || 0) + 1;

    logger.info(`节点已添加: ${id}`, {
      name: record.name,
      type: record.type
    });

    this.emit('nodeAdded', record);

    if (this.config.autoSave) {
      this._saveGraph().catch(err => {
        logger.error('自动保存失败', err);
      });
    }

    return id;
  }

  /**
   * 更新节点
   * @param {string} id - 节点 ID
   * @param {Object} updates - 更新内容
   * @returns {boolean} - 是否成功
   */
  updateNode(id, updates) {
    const node = this.nodes.get(id);
    if (!node) {
      return false;
    }

    Object.assign(node, updates);
    node.updatedAt = Date.now();

    logger.info(`节点已更新: ${id}`);

    this.emit('nodeUpdated', node);

    if (this.config.autoSave) {
      this._saveGraph().catch(err => {
        logger.error('自动保存失败', err);
      });
    }

    return true;
  }

  /**
   * 删除节点
   * @param {string} id - 节点 ID
   * @returns {boolean} - 是否成功
   */
  deleteNode(id) {
    const node = this.nodes.get(id);
    if (!node) {
      return false;
    }

    // 删除相关的边
    const relatedEdges = this.getNodeEdges(id);
    for (const edge of relatedEdges) {
      this.deleteEdge(edge.id);
    }

    // 删除节点
    this.nodes.delete(id);
    this.stats.totalNodes--;

    // 更新索引
    if (this.nodesByType.has(node.type)) {
      this.nodesByType.get(node.type).delete(id);
    }

    // 更新统计
    this.stats.nodesByType[node.type]--;

    logger.info(`节点已删除: ${id}`);

    this.emit('nodeDeleted', { id });

    if (this.config.autoSave) {
      this._saveGraph().catch(err => {
        logger.error('自动保存失败', err);
      });
    }

    return true;
  }

  /**
   * 获取节点
   * @param {string} id - 节点 ID
   * @returns {Object|null} - 节点信息
   */
  getNode(id) {
    return this.nodes.get(id) || null;
  }

  /**
   * 查询节点
   * @param {Object} filters - 过滤条件
   * @returns {Array<Object>} - 节点列表
   */
  queryNodes(filters = {}) {
    let nodes = Array.from(this.nodes.values());

    // 按类型过滤
    if (filters.type) {
      nodes = nodes.filter(n => n.type === filters.type);
    }

    // 按标签过滤
    if (filters.tags && filters.tags.length > 0) {
      nodes = nodes.filter(n =>
        filters.tags.some(tag => n.tags.includes(tag))
      );
    }

    // 按名称搜索
    if (filters.name) {
      const searchTerm = filters.name.toLowerCase();
      nodes = nodes.filter(n =>
        n.name.toLowerCase().includes(searchTerm)
      );
    }

    // 限制数量
    if (filters.limit) {
      nodes = nodes.slice(0, filters.limit);
    }

    return nodes;
  }

  /**
   * 添加边
   * @param {Object} edge - 边信息
   * @returns {string} - 边 ID
   */
  addEdge(edge) {
    const id = edge.id || generateId();

    // 验证节点存在
    if (!this.nodes.has(edge.from) || !this.nodes.has(edge.to)) {
      throw new Error('源节点或目标节点不存在');
    }

    const record = {
      id,
      from: edge.from,
      to: edge.to,
      type: edge.type || RelationType.RELATED_TO,
      weight: edge.weight || 1.0,
      properties: edge.properties || {},
      createdAt: Date.now()
    };

    this.edges.set(id, record);
    this.stats.totalEdges++;

    // 更新索引
    if (!this.edgesByType.has(record.type)) {
      this.edgesByType.set(record.type, new Set());
    }
    this.edgesByType.get(record.type).add(id);

    // 更新统计
    this.stats.edgesByType[record.type] = (this.stats.edgesByType[record.type] || 0) + 1;

    logger.info(`边已添加: ${id}`, {
      from: edge.from,
      to: edge.to,
      type: record.type
    });

    this.emit('edgeAdded', record);

    if (this.config.autoSave) {
      this._saveGraph().catch(err => {
        logger.error('自动保存失败', err);
      });
    }

    return id;
  }

  /**
   * 删除边
   * @param {string} id - 边 ID
   * @returns {boolean} - 是否成功
   */
  deleteEdge(id) {
    const edge = this.edges.get(id);
    if (!edge) {
      return false;
    }

    this.edges.delete(id);
    this.stats.totalEdges--;

    // 更新索引
    if (this.edgesByType.has(edge.type)) {
      this.edgesByType.get(edge.type).delete(id);
    }

    // 更新统计
    this.stats.edgesByType[edge.type]--;

    logger.info(`边已删除: ${id}`);

    this.emit('edgeDeleted', { id });

    if (this.config.autoSave) {
      this._saveGraph().catch(err => {
        logger.error('自动保存失败', err);
      });
    }

    return true;
  }

  /**
   * 获取节点的所有边
   * @param {string} nodeId - 节点 ID
   * @returns {Array<Object>} - 边列表
   */
  getNodeEdges(nodeId) {
    return Array.from(this.edges.values()).filter(
      edge => edge.from === nodeId || edge.to === nodeId
    );
  }

  /**
   * 获取节点的邻居
   * @param {string} nodeId - 节点 ID
   * @param {Object} options - 选项
   * @returns {Array<Object>} - 邻居节点列表
   */
  getNeighbors(nodeId, options = {}) {
    const edges = this.getNodeEdges(nodeId);
    const neighbors = new Set();

    for (const edge of edges) {
      // 根据方向过滤
      if (options.direction === 'outgoing' && edge.from === nodeId) {
        neighbors.add(edge.to);
      } else if (options.direction === 'incoming' && edge.to === nodeId) {
        neighbors.add(edge.from);
      } else if (!options.direction) {
        neighbors.add(edge.from === nodeId ? edge.to : edge.from);
      }

      // 根据关系类型过滤
      if (options.relationType && edge.type !== options.relationType) {
        continue;
      }
    }

    return Array.from(neighbors).map(id => this.getNode(id)).filter(Boolean);
  }

  /**
   * 查找路径
   * @param {string} fromId - 起始节点 ID
   * @param {string} toId - 目标节点 ID
   * @param {Object} options - 选项
   * @returns {Array<Array<string>>|null} - 路径列表
   */
  findPath(fromId, toId, options = {}) {
    const maxDepth = options.maxDepth || 5;
    const visited = new Set();
    const paths = [];

    const dfs = (currentId, targetId, path, depth) => {
      if (depth > maxDepth) {
        return;
      }

      if (currentId === targetId) {
        paths.push([...path, currentId]);
        return;
      }

      visited.add(currentId);
      path.push(currentId);

      const neighbors = this.getNeighbors(currentId, {
        direction: 'outgoing'
      });

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          dfs(neighbor.id, targetId, path, depth + 1);
        }
      }

      path.pop();
      visited.delete(currentId);
    };

    dfs(fromId, toId, [], 0);

    return paths.length > 0 ? paths : null;
  }

  /**
   * 获取统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * 导出图数据
   * @returns {Object} - 图数据
   */
  exportGraph() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      stats: this.stats
    };
  }

  /**
   * 导入图数据
   * @param {Object} data - 图数据
   */
  importGraph(data) {
    this.nodes.clear();
    this.edges.clear();
    this.nodesByType.clear();
    this.edgesByType.clear();

    // 导入节点
    for (const node of data.nodes || []) {
      this.nodes.set(node.id, node);

      if (!this.nodesByType.has(node.type)) {
        this.nodesByType.set(node.type, new Set());
      }
      this.nodesByType.get(node.type).add(node.id);
    }

    // 导入边
    for (const edge of data.edges || []) {
      this.edges.set(edge.id, edge);

      if (!this.edgesByType.has(edge.type)) {
        this.edgesByType.set(edge.type, new Set());
      }
      this.edgesByType.get(edge.type).add(edge.id);
    }

    // 更新统计
    if (data.stats) {
      Object.assign(this.stats, data.stats);
    }

    logger.info('图数据已导入', {
      nodes: this.nodes.size,
      edges: this.edges.size
    });

    this.emit('graphImported');
  }

  /**
   * 加载图数据
   * @private
   * @returns {Promise<void>}
   */
  async _loadGraph() {
    const filePath = join(this.config.storageDir, this.config.graphFile);

    if (!existsSync(filePath)) {
      return;
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      this.importGraph(data);

      logger.info('图数据已加载');
    } catch (error) {
      logger.error('加载图数据失败', error);
    }
  }

  /**
   * 保存图数据
   * @private
   * @returns {Promise<void>}
   */
  async _saveGraph() {
    const filePath = join(this.config.storageDir, this.config.graphFile);

    const data = {
      ...this.exportGraph(),
      savedAt: Date.now()
    };

    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 清理资源
   */
  async destroy() {
    if (this.config.autoSave) {
      await this._saveGraph();
    }

    this.nodes.clear();
    this.edges.clear();
    this.nodesByType.clear();
    this.edgesByType.clear();
    this.removeAllListeners();

    logger.info('知识图谱管理器已销毁');
  }
}

/**
 * 创建知识图谱管理器
 * @param {Object} config - 配置选项
 * @returns {KnowledgeGraph} - 管理器实例
 */
export function createKnowledgeGraph(config) {
  return new KnowledgeGraph(config);
}
