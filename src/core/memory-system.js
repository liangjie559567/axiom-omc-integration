/**
 * 记忆和知识管理系统
 * 整合决策记录、知识图谱和模式提取
 */

import { EventEmitter } from 'events';
import { Logger } from './logger.js';
import { DecisionManager } from './decision-manager.js';
import { KnowledgeGraph } from './knowledge-graph.js';

const logger = new Logger('MemorySystem');

/**
 * 记忆系统类
 */
export class MemorySystem extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} config - 配置选项
   */
  constructor(config = {}) {
    super();

    this.config = {
      storageDir: config.storageDir || '.omc/memory',
      enablePatternExtraction: config.enablePatternExtraction !== false,
      patternThreshold: config.patternThreshold || 3, // 出现 3 次自动提炼
      ...config
    };

    // 决策记录管理器
    this.decisionManager = new DecisionManager({
      storageDir: this.config.storageDir
    });

    // 知识图谱
    this.knowledgeGraph = new KnowledgeGraph({
      storageDir: this.config.storageDir
    });

    // 模式存储
    this.patterns = new Map();

    // 事件计数器（用于模式提取）
    this.eventCounts = new Map();

    // 统计信息
    this.stats = {
      totalPatterns: 0,
      extractedPatterns: 0
    };

    this._setupEventHandlers();

    logger.info('记忆系统已初始化');
  }

  /**
   * 初始化
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      await Promise.all([
        this.decisionManager.initialize(),
        this.knowledgeGraph.initialize()
      ]);

      logger.info('记忆系统初始化完成');

      this.emit('initialized');
    } catch (error) {
      logger.error('初始化失败', error);
      throw error;
    }
  }

  /**
   * 添加决策记录
   * @param {Object} decision - 决策信息
   * @returns {string} - 决策 ID
   */
  addDecision(decision) {
    const id = this.decisionManager.addDecision(decision);

    // 在知识图谱中创建节点
    const nodeId = this.knowledgeGraph.addNode({
      type: 'decision',
      name: decision.title,
      description: decision.decision,
      properties: {
        decisionId: id,
        type: decision.type,
        status: decision.status
      },
      tags: decision.tags
    });

    // 创建与相关决策的关系
    if (decision.relatedDecisions && decision.relatedDecisions.length > 0) {
      for (const relatedId of decision.relatedDecisions) {
        const relatedNode = this._findDecisionNode(relatedId);
        if (relatedNode) {
          this.knowledgeGraph.addEdge({
            from: nodeId,
            to: relatedNode.id,
            type: 'related_to'
          });
        }
      }
    }

    return id;
  }

  /**
   * 更新决策记录
   * @param {string} id - 决策 ID
   * @param {Object} updates - 更新内容
   * @returns {boolean} - 是否成功
   */
  updateDecision(id, updates) {
    const success = this.decisionManager.updateDecision(id, updates);

    if (success) {
      // 更新知识图谱中的节点
      const node = this._findDecisionNode(id);
      if (node) {
        this.knowledgeGraph.updateNode(node.id, {
          name: updates.title || node.name,
          description: updates.decision || node.description,
          properties: {
            ...node.properties,
            status: updates.status || node.properties.status
          }
        });
      }
    }

    return success;
  }

  /**
   * 删除决策记录
   * @param {string} id - 决策 ID
   * @returns {boolean} - 是否成功
   */
  deleteDecision(id) {
    const success = this.decisionManager.deleteDecision(id);

    if (success) {
      // 删除知识图谱中的节点
      const node = this._findDecisionNode(id);
      if (node) {
        this.knowledgeGraph.deleteNode(node.id);
      }
    }

    return success;
  }

  /**
   * 获取决策记录
   * @param {string} id - 决策 ID
   * @returns {Object|null} - 决策记录
   */
  getDecision(id) {
    return this.decisionManager.getDecision(id);
  }

  /**
   * 查询决策记录
   * @param {Object} filters - 过滤条件
   * @returns {Array<Object>} - 决策列表
   */
  queryDecisions(filters = {}) {
    return this.decisionManager.queryDecisions(filters);
  }

  /**
   * 设置用户偏好
   * @param {string} key - 偏好键
   * @param {any} value - 偏好值
   */
  setPreference(key, value) {
    this.decisionManager.setPreference(key, value);

    // 记录事件用于模式提取
    this._recordEvent('preference_set', { key, value });
  }

  /**
   * 获取用户偏好
   * @param {string} key - 偏好键
   * @param {any} defaultValue - 默认值
   * @returns {any} - 偏好值
   */
  getPreference(key, defaultValue = null) {
    return this.decisionManager.getPreference(key, defaultValue);
  }

  /**
   * 更新活动上下文
   * @param {Object} updates - 更新内容
   */
  updateContext(updates) {
    this.decisionManager.updateContext(updates);
  }

  /**
   * 获取活动上下文
   * @returns {Object} - 上下文对象
   */
  getContext() {
    return this.decisionManager.getContext();
  }

  /**
   * 添加知识节点
   * @param {Object} node - 节点信息
   * @returns {string} - 节点 ID
   */
  addKnowledgeNode(node) {
    return this.knowledgeGraph.addNode(node);
  }

  /**
   * 添加知识关系
   * @param {Object} edge - 边信息
   * @returns {string} - 边 ID
   */
  addKnowledgeEdge(edge) {
    return this.knowledgeGraph.addEdge(edge);
  }

  /**
   * 查询知识节点
   * @param {Object} filters - 过滤条件
   * @returns {Array<Object>} - 节点列表
   */
  queryKnowledgeNodes(filters = {}) {
    return this.knowledgeGraph.queryNodes(filters);
  }

  /**
   * 获取节点邻居
   * @param {string} nodeId - 节点 ID
   * @param {Object} options - 选项
   * @returns {Array<Object>} - 邻居节点列表
   */
  getKnowledgeNeighbors(nodeId, options = {}) {
    return this.knowledgeGraph.getNeighbors(nodeId, options);
  }

  /**
   * 查找知识路径
   * @param {string} fromId - 起始节点 ID
   * @param {string} toId - 目标节点 ID
   * @param {Object} options - 选项
   * @returns {Array<Array<string>>|null} - 路径列表
   */
  findKnowledgePath(fromId, toId, options = {}) {
    return this.knowledgeGraph.findPath(fromId, toId, options);
  }

  /**
   * 提取模式
   * @param {string} eventType - 事件类型
   * @returns {Object|null} - 提取的模式
   */
  extractPattern(eventType) {
    const count = this.eventCounts.get(eventType) || 0;

    if (count < this.config.patternThreshold) {
      return null;
    }

    // 创建模式
    const pattern = {
      id: `pattern-${eventType}-${Date.now()}`,
      type: eventType,
      occurrences: count,
      extractedAt: Date.now(),
      description: `模式: ${eventType} 出现 ${count} 次`
    };

    this.patterns.set(pattern.id, pattern);
    this.stats.totalPatterns++;
    this.stats.extractedPatterns++;

    logger.info(`模式已提取: ${pattern.id}`, {
      type: eventType,
      occurrences: count
    });

    this.emit('patternExtracted', pattern);

    // 重置计数
    this.eventCounts.set(eventType, 0);

    return pattern;
  }

  /**
   * 获取所有模式
   * @returns {Array<Object>} - 模式列表
   */
  getPatterns() {
    return Array.from(this.patterns.values());
  }

  /**
   * 获取统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      decisions: this.decisionManager.getStats(),
      knowledge: this.knowledgeGraph.getStats()
    };
  }

  /**
   * 搜索知识图谱
   * @param {string} query - 搜索关键词
   * @returns {Array} - 搜索结果
   */
  searchKnowledge(query) {
    const nodes = Array.from(this.knowledgeGraph.nodes.values());
    const lowerQuery = query.toLowerCase();

    return nodes.filter(node => {
      return (
        (node.name && node.name.toLowerCase().includes(lowerQuery)) ||
        (node.description && node.description.toLowerCase().includes(lowerQuery)) ||
        (node.tags && node.tags.some(tag => tag && tag.toLowerCase().includes(lowerQuery)))
      );
    });
  }

  /**
   * 保存所有数据
   * @returns {Promise<void>}
   */
  async saveAll() {
    await Promise.all([
      this.decisionManager.saveAll(),
      this.knowledgeGraph._saveGraph()
    ]);

    logger.info('所有数据已保存');
  }

  /**
   * 记录事件（用于模式提取）
   * @private
   * @param {string} eventType - 事件类型
   * @param {Object} data - 事件数据
   */
  _recordEvent(eventType, data) {
    if (!this.config.enablePatternExtraction) {
      return;
    }

    const count = (this.eventCounts.get(eventType) || 0) + 1;
    this.eventCounts.set(eventType, count);

    // 检查是否达到阈值
    if (count >= this.config.patternThreshold) {
      this.extractPattern(eventType);
    }
  }

  /**
   * 查找决策节点
   * @private
   * @param {string} decisionId - 决策 ID
   * @returns {Object|null} - 节点
   */
  _findDecisionNode(decisionId) {
    const nodes = this.knowledgeGraph.queryNodes({
      type: 'decision'
    });

    return nodes.find(n => n.properties.decisionId === decisionId) || null;
  }

  /**
   * 设置事件处理器
   * @private
   */
  _setupEventHandlers() {
    // 转发决策管理器事件
    this.decisionManager.on('decisionAdded', (decision) => {
      this.emit('decisionAdded', decision);
      this._recordEvent('decision_added', decision);
    });

    this.decisionManager.on('decisionUpdated', (decision) => {
      this.emit('decisionUpdated', decision);
      this._recordEvent('decision_updated', decision);
    });

    this.decisionManager.on('preferenceSet', (data) => {
      this.emit('preferenceSet', data);
    });

    // 转发知识图谱事件
    this.knowledgeGraph.on('nodeAdded', (node) => {
      this.emit('knowledgeNodeAdded', node);
      this._recordEvent('knowledge_node_added', node);
    });

    this.knowledgeGraph.on('edgeAdded', (edge) => {
      this.emit('knowledgeEdgeAdded', edge);
      this._recordEvent('knowledge_edge_added', edge);
    });
  }

  /**
   * 清理资源
   */
  async destroy() {
    await Promise.all([
      this.decisionManager.destroy(),
      this.knowledgeGraph.destroy()
    ]);

    this.patterns.clear();
    this.eventCounts.clear();
    this.removeAllListeners();

    logger.info('记忆系统已销毁');
  }
}

/**
 * 创建记忆系统
 * @param {Object} config - 配置选项
 * @returns {MemorySystem} - 系统实例
 */
export function createMemorySystem(config) {
  return new MemorySystem(config);
}
