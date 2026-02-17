/**
 * 智能决策引擎
 * 基于知识图谱和历史数据提供智能决策支持
 */

import { EventEmitter } from 'events';
import { Logger } from '../core/logger.js';

const logger = new Logger('DecisionEngine');

/**
 * 决策类型枚举
 */
export const DecisionType = {
  AGENT_SELECTION: 'agent_selection',
  WORKFLOW_ROUTING: 'workflow_routing',
  RESOURCE_ALLOCATION: 'resource_allocation',
  ERROR_RECOVERY: 'error_recovery',
  OPTIMIZATION: 'optimization'
};

/**
 * 决策置信度级别
 */
export const ConfidenceLevel = {
  HIGH: 'high',      // > 0.8
  MEDIUM: 'medium',  // 0.5 - 0.8
  LOW: 'low'         // < 0.5
};

/**
 * 智能决策引擎类
 */
export class DecisionEngine extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    super();

    this.options = {
      enableLearning: true,
      confidenceThreshold: 0.5,
      maxHistorySize: 1000,
      ...options
    };

    // 决策历史
    this.decisionHistory = [];

    // 决策规则库
    this.rules = new Map();

    // 上下文权重
    this.contextWeights = new Map();

    // 知识图谱引用
    this.knowledgeGraph = null;

    // 学习模型
    this.learningModel = {
      successPatterns: new Map(),
      failurePatterns: new Map()
    };

    logger.info('智能决策引擎已初始化', this.options);
  }

  /**
   * 设置知识图谱
   * @param {Object} knowledgeGraph - 知识图谱实例
   */
  setKnowledgeGraph(knowledgeGraph) {
    this.knowledgeGraph = knowledgeGraph;
    logger.info('知识图谱已连接');
  }

  /**
   * 注册决策规则
   * @param {string} type - 决策类型
   * @param {Function} rule - 规则函数
   * @param {number} priority - 优先级
   */
  registerRule(type, rule, priority = 0) {
    if (!this.rules.has(type)) {
      this.rules.set(type, []);
    }

    this.rules.get(type).push({ rule, priority });

    // 按优先级排序
    this.rules.get(type).sort((a, b) => b.priority - a.priority);

    logger.info('决策规则已注册', { type, priority });
  }

  /**
   * 做出决策
   * @param {string} type - 决策类型
   * @param {Object} context - 决策上下文
   * @returns {Object} 决策结果
   */
  async makeDecision(type, context) {
    const startTime = Date.now();

    try {
      // 1. 收集上下文信息
      const enrichedContext = await this._enrichContext(context);

      // 2. 应用决策规则
      const ruleResults = await this._applyRules(type, enrichedContext);

      // 3. 查询知识图谱
      const graphInsights = await this._queryKnowledgeGraph(type, enrichedContext);

      // 4. 应用学习模型
      const learningInsights = this._applyLearning(type, enrichedContext);

      // 5. 综合决策
      const decision = this._synthesizeDecision({
        type,
        context: enrichedContext,
        ruleResults,
        graphInsights,
        learningInsights
      });

      // 6. 记录决策
      this._recordDecision(decision, Date.now() - startTime);

      // 7. 触发事件
      this.emit('decision', decision);

      logger.info('决策完成', {
        type,
        decision: decision.choice,
        confidence: decision.confidence,
        duration: Date.now() - startTime
      });

      return decision;

    } catch (error) {
      logger.error('决策失败', { type, error: error.message });
      throw error;
    }
  }

  /**
   * 丰富上下文信息
   * @private
   */
  async _enrichContext(context) {
    return {
      ...context,
      timestamp: Date.now(),
      historicalContext: this._getHistoricalContext(context),
      environmentContext: this._getEnvironmentContext()
    };
  }

  /**
   * 应用决策规则
   * @private
   */
  async _applyRules(type, context) {
    const rules = this.rules.get(type) || [];
    const results = [];

    for (const { rule, priority } of rules) {
      try {
        const result = await rule(context);
        if (result) {
          results.push({ ...result, priority });
        }
      } catch (error) {
        logger.warn('规则执行失败', { type, error: error.message });
      }
    }

    return results;
  }

  /**
   * 查询知识图谱
   * @private
   */
  async _queryKnowledgeGraph(type, context) {
    if (!this.knowledgeGraph) {
      return null;
    }

    try {
      // 查询相关节点和关系
      const relevantNodes = await this.knowledgeGraph.query({
        type: 'decision',
        decisionType: type,
        context: context
      });

      return relevantNodes;
    } catch (error) {
      logger.warn('知识图谱查询失败', { error: error.message });
      return null;
    }
  }

  /**
   * 应用学习模型
   * @private
   */
  _applyLearning(type, context) {
    if (!this.options.enableLearning) {
      return null;
    }

    const successPatterns = this.learningModel.successPatterns.get(type) || [];
    const failurePatterns = this.learningModel.failurePatterns.get(type) || [];

    // 计算与成功模式的相似度
    const successScore = this._calculatePatternSimilarity(context, successPatterns);

    // 计算与失败模式的相似度
    const failureScore = this._calculatePatternSimilarity(context, failurePatterns);

    return {
      successScore,
      failureScore,
      recommendation: successScore > failureScore ? 'proceed' : 'caution'
    };
  }

  /**
   * 综合决策
   * @private
   */
  _synthesizeDecision({ type, context, ruleResults, graphInsights, learningInsights }) {
    // 收集所有候选决策
    const candidates = new Map();

    // 1. 从规则结果中提取候选
    for (const result of ruleResults) {
      const key = JSON.stringify(result.choice);
      if (!candidates.has(key)) {
        candidates.set(key, {
          choice: result.choice,
          scores: [],
          sources: [],
          priority: result.priority
        });
      }
      // 置信度保持在0-1范围内，优先级用于排序
      candidates.get(key).scores.push(result.confidence);
      candidates.get(key).sources.push('rule');
    }

    // 2. 从知识图谱中提取候选
    if (graphInsights && graphInsights.length > 0) {
      for (const insight of graphInsights) {
        const key = JSON.stringify(insight.recommendation);
        if (!candidates.has(key)) {
          candidates.set(key, {
            choice: insight.recommendation,
            scores: [],
            sources: []
          });
        }
        candidates.get(key).scores.push(insight.confidence);
        candidates.get(key).sources.push('knowledge_graph');
      }
    }

    // 3. 应用学习洞察
    if (learningInsights) {
      for (const [key, candidate] of candidates) {
        if (learningInsights.recommendation === 'proceed') {
          candidate.scores.push(learningInsights.successScore);
        } else {
          candidate.scores.push(1 - learningInsights.failureScore);
        }
        candidate.sources.push('learning');
      }
    }

    // 4. 计算最终得分并选择最佳决策
    let bestCandidate = null;
    let bestScore = -1;

    for (const [key, candidate] of candidates) {
      const avgScore = candidate.scores.reduce((a, b) => a + b, 0) / candidate.scores.length;
      // 如果有优先级，将其作为加权因子（归一化到0.1-0.3范围）
      const priorityBonus = candidate.priority ? Math.min(candidate.priority / 100, 0.3) : 0;
      const finalScore = Math.min(avgScore + priorityBonus, 1.0);

      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestCandidate = candidate;
      }
    }

    // 5. 构建决策结果
    const confidence = bestScore;
    const confidenceLevel = this._getConfidenceLevel(confidence);

    return {
      id: `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      choice: bestCandidate ? bestCandidate.choice : null,
      confidence,
      confidenceLevel,
      sources: bestCandidate ? bestCandidate.sources : [],
      context,
      timestamp: Date.now(),
      reasoning: this._generateReasoning(bestCandidate, ruleResults, graphInsights, learningInsights)
    };
  }

  /**
   * 获取置信度级别
   * @private
   */
  _getConfidenceLevel(confidence) {
    if (confidence > 0.8) return ConfidenceLevel.HIGH;
    if (confidence > 0.5) return ConfidenceLevel.MEDIUM;
    return ConfidenceLevel.LOW;
  }

  /**
   * 生成决策推理说明
   * @private
   */
  _generateReasoning(candidate, ruleResults, graphInsights, learningInsights) {
    const reasoning = [];

    if (candidate && candidate.sources.includes('rule')) {
      reasoning.push(`基于 ${ruleResults.length} 条规则的分析`);
    }

    if (candidate && candidate.sources.includes('knowledge_graph')) {
      reasoning.push('参考了知识图谱中的历史经验');
    }

    if (candidate && candidate.sources.includes('learning')) {
      reasoning.push('应用了机器学习模型的建议');
    }

    return reasoning.join('；');
  }

  /**
   * 记录决策
   * @private
   */
  _recordDecision(decision, duration) {
    this.decisionHistory.push({
      ...decision,
      duration
    });

    // 限制历史大小
    if (this.decisionHistory.length > this.options.maxHistorySize) {
      this.decisionHistory.shift();
    }

    this.emit('decision_recorded', decision);
  }

  /**
   * 反馈决策结果
   * @param {string} decisionId - 决策ID
   * @param {boolean} success - 是否成功
   * @param {Object} feedback - 反馈信息
   */
  provideFeedback(decisionId, success, feedback = {}) {
    const decision = this.decisionHistory.find(d => d.id === decisionId);

    if (!decision) {
      logger.warn('决策未找到', { decisionId });
      return;
    }

    // 更新决策记录
    decision.feedback = {
      success,
      ...feedback,
      timestamp: Date.now()
    };

    // 学习
    if (this.options.enableLearning) {
      this._learn(decision, success);
    }

    logger.info('决策反馈已记录', { decisionId, success });
    this.emit('feedback', { decisionId, success, feedback });
  }

  /**
   * 学习决策模式
   * @private
   */
  _learn(decision, success) {
    const { type, context, choice } = decision;

    const pattern = {
      context: this._extractPattern(context),
      choice,
      timestamp: Date.now()
    };

    if (success) {
      if (!this.learningModel.successPatterns.has(type)) {
        this.learningModel.successPatterns.set(type, []);
      }
      this.learningModel.successPatterns.get(type).push(pattern);
    } else {
      if (!this.learningModel.failurePatterns.has(type)) {
        this.learningModel.failurePatterns.set(type, []);
      }
      this.learningModel.failurePatterns.get(type).push(pattern);
    }

    logger.info('决策模式已学习', { type, success });
  }

  /**
   * 提取模式特征
   * @private
   */
  _extractPattern(context) {
    // 提取关键特征
    return {
      agentType: context.agentType,
      workflowPhase: context.workflowPhase,
      resourceLoad: context.resourceLoad,
      errorType: context.errorType
    };
  }

  /**
   * 计算模式相似度
   * @private
   */
  _calculatePatternSimilarity(context, patterns) {
    if (patterns.length === 0) return 0;

    const contextPattern = this._extractPattern(context);
    let totalSimilarity = 0;

    for (const pattern of patterns) {
      let similarity = 0;
      let fields = 0;

      for (const key in contextPattern) {
        if (pattern.context[key] !== undefined) {
          fields++;
          if (contextPattern[key] === pattern.context[key]) {
            similarity++;
          }
        }
      }

      if (fields > 0) {
        totalSimilarity += similarity / fields;
      }
    }

    return totalSimilarity / patterns.length;
  }

  /**
   * 获取历史上下文
   * @private
   */
  _getHistoricalContext(context) {
    // 查找相似的历史决策
    const similar = this.decisionHistory
      .filter(d => d.type === context.type)
      .slice(-10);

    return {
      count: similar.length,
      recentDecisions: similar.map(d => ({
        choice: d.choice,
        confidence: d.confidence,
        success: d.feedback?.success
      }))
    };
  }

  /**
   * 获取环境上下文
   * @private
   */
  _getEnvironmentContext() {
    return {
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  /**
   * 获取决策历史
   * @param {Object} filter - 过滤条件
   * @returns {Array} 决策历史
   */
  getHistory(filter = {}) {
    let history = [...this.decisionHistory];

    if (filter.type) {
      history = history.filter(d => d.type === filter.type);
    }

    if (filter.confidenceLevel) {
      history = history.filter(d => d.confidenceLevel === filter.confidenceLevel);
    }

    if (filter.startTime) {
      history = history.filter(d => d.timestamp >= filter.startTime);
    }

    if (filter.endTime) {
      history = history.filter(d => d.timestamp <= filter.endTime);
    }

    return history;
  }

  /**
   * 获取决策统计
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const total = this.decisionHistory.length;
    const withFeedback = this.decisionHistory.filter(d => d.feedback).length;
    const successful = this.decisionHistory.filter(d => d.feedback?.success).length;

    const byType = {};
    const byConfidenceLevel = {};

    for (const decision of this.decisionHistory) {
      byType[decision.type] = (byType[decision.type] || 0) + 1;
      byConfidenceLevel[decision.confidenceLevel] = (byConfidenceLevel[decision.confidenceLevel] || 0) + 1;
    }

    return {
      total,
      withFeedback,
      successful,
      successRate: withFeedback > 0 ? successful / withFeedback : 0,
      byType,
      byConfidenceLevel,
      averageDuration: this.decisionHistory.reduce((sum, d) => sum + (d.duration || 0), 0) / total
    };
  }

  /**
   * 清空决策历史
   */
  clearHistory() {
    this.decisionHistory = [];
    logger.info('决策历史已清空');
  }

  /**
   * 销毁决策引擎
   */
  destroy() {
    this.clearHistory();
    this.rules.clear();
    this.contextWeights.clear();
    this.learningModel.successPatterns.clear();
    this.learningModel.failurePatterns.clear();
    this.removeAllListeners();
    logger.info('智能决策引擎已销毁');
  }
}

export default DecisionEngine;
