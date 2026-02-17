/**
 * PhaseMapper - 智能映射引擎
 *
 * 负责处理 Axiom 和 OMC 之间的阶段映射，支持：
 * - 基础映射（一对一、一对多）
 * - 条件映射（基于上下文）
 * - 多对多映射
 * - 权重排序
 * - 反向映射
 */

import { Logger } from './logger.js';
import { generateId } from '../utils/index.js';

const logger = new Logger('PhaseMapper');

/**
 * PhaseMapper 类
 */
export class PhaseMapper {
  /**
   * 构造函数
   */
  constructor() {
    this.mappingRules = new Map();  // 映射规则存储
    this.customMappers = new Map(); // 自定义映射函数
    this.stats = {
      totalRules: 0,
      totalMappings: 0,
      cacheHits: 0
    };

    logger.info('PhaseMapper 已初始化');
  }

  /**
   * 注册映射规则
   * @param {Object} rule - 映射规则
   * @param {string} rule.id - 规则 ID（可选）
   * @param {string} rule.from - 源阶段
   * @param {Array<string>} rule.to - 目标阶段列表
   * @param {Function} rule.condition - 条件函数（可选）
   * @param {number} rule.weight - 权重（可选，默认 1.0）
   * @param {boolean} rule.bidirectional - 是否双向（可选）
   * @returns {string} - 规则 ID
   */
  registerRule(rule) {
    // 验证规则
    this._validateRule(rule);

    // 生成或使用提供的 ID
    const id = rule.id || generateId();

    // 存储规则
    const ruleData = {
      ...rule,
      id,
      weight: rule.weight !== undefined ? rule.weight : 1.0,
      bidirectional: rule.bidirectional || false,
      createdAt: Date.now()
    };

    this.mappingRules.set(id, ruleData);
    this.stats.totalRules++;

    logger.info(`映射规则已注册: ${id}`, {
      from: rule.from,
      to: rule.to,
      weight: ruleData.weight
    });

    return id;
  }

  /**
   * 执行映射
   * @param {string} fromPhase - 源阶段
   * @param {Object} context - 上下文（可选）
   * @returns {Array<string>} - 目标阶段列表（按权重排序）
   */
  map(fromPhase, context = {}) {
    // 1. 查找匹配的规则
    const matchingRules = this._findMatchingRules(fromPhase);

    if (matchingRules.length === 0) {
      logger.warn(`没有找到匹配的映射规则: ${fromPhase}`);
      return [];
    }

    // 2. 评估条件，过滤有效规则
    const validRules = matchingRules.filter(rule => {
      if (!rule.condition) {
        return true; // 没有条件，总是有效
      }

      try {
        return rule.condition(context);
      } catch (error) {
        logger.error(`条件评估失败: ${rule.id}`, error);
        return false;
      }
    });

    if (validRules.length === 0) {
      logger.warn(`没有满足条件的映射规则: ${fromPhase}`, { context });
      return [];
    }

    // 3. 按权重排序（降序）
    validRules.sort((a, b) => (b.weight || 0) - (a.weight || 0));

    // 4. 提取目标阶段
    const targetPhases = [];
    for (const rule of validRules) {
      targetPhases.push(...rule.to);
    }

    // 5. 去重（保持顺序）
    const uniquePhases = [...new Set(targetPhases)];

    this.stats.totalMappings++;

    logger.debug(`映射完成: ${fromPhase} -> [${uniquePhases.join(', ')}]`, {
      rulesMatched: validRules.length,
      context
    });

    return uniquePhases;
  }

  /**
   * 反向映射
   * @param {string} toPhase - 目标阶段
   * @param {Object} context - 上下文（可选）
   * @returns {Array<string>} - 源阶段列表
   */
  reverseMap(toPhase, context = {}) {
    // 查找包含目标阶段的规则
    const reverseRules = Array.from(this.mappingRules.values())
      .filter(rule => rule.to.includes(toPhase));

    if (reverseRules.length === 0) {
      logger.warn(`没有找到反向映射规则: ${toPhase}`);
      return [];
    }

    // 评估条件
    const validRules = reverseRules.filter(rule => {
      if (!rule.condition) {
        return true;
      }

      try {
        return rule.condition(context);
      } catch (error) {
        logger.error(`反向映射条件评估失败: ${rule.id}`, error);
        return false;
      }
    });

    // 提取源阶段
    const sourcePhases = validRules.map(rule => rule.from);

    // 去重
    const uniquePhases = [...new Set(sourcePhases)];

    logger.debug(`反向映射完成: ${toPhase} -> [${uniquePhases.join(', ')}]`, {
      rulesMatched: validRules.length
    });

    return uniquePhases;
  }

  /**
   * 注册自定义映射函数
   * @param {string} name - 映射器名称
   * @param {Function} mapperFn - 映射函数 (fromPhase, context) => Array<string>
   */
  registerCustomMapper(name, mapperFn) {
    if (typeof mapperFn !== 'function') {
      throw new Error('映射函数必须是一个函数');
    }

    this.customMappers.set(name, mapperFn);
    logger.info(`自定义映射器已注册: ${name}`);
  }

  /**
   * 使用自定义映射器
   * @param {string} name - 映射器名称
   * @param {string} fromPhase - 源阶段
   * @param {Object} context - 上下文
   * @returns {Array<string>} - 目标阶段列表
   */
  mapWithCustomMapper(name, fromPhase, context = {}) {
    const mapper = this.customMappers.get(name);
    if (!mapper) {
      throw new Error(`自定义映射器不存在: ${name}`);
    }

    try {
      const result = mapper(fromPhase, context);

      if (!Array.isArray(result)) {
        throw new Error('自定义映射器必须返回数组');
      }

      logger.debug(`自定义映射完成: ${name}`, {
        from: fromPhase,
        to: result
      });

      return result;
    } catch (error) {
      logger.error(`自定义映射器执行失败: ${name}`, error);
      throw error;
    }
  }

  /**
   * 获取所有映射规则
   * @returns {Array<Object>} - 规则列表
   */
  getAllRules() {
    return Array.from(this.mappingRules.values());
  }

  /**
   * 获取指定规则
   * @param {string} ruleId - 规则 ID
   * @returns {Object|null} - 规则对象
   */
  getRule(ruleId) {
    return this.mappingRules.get(ruleId) || null;
  }

  /**
   * 删除映射规则
   * @param {string} ruleId - 规则 ID
   * @returns {boolean} - 是否成功
   */
  deleteRule(ruleId) {
    const deleted = this.mappingRules.delete(ruleId);
    if (deleted) {
      this.stats.totalRules--;
      logger.info(`映射规则已删除: ${ruleId}`);
    }
    return deleted;
  }

  /**
   * 清空所有规则
   */
  clearRules() {
    const count = this.mappingRules.size;
    this.mappingRules.clear();
    this.stats.totalRules = 0;
    logger.info(`已清空所有映射规则: ${count} 条`);
  }

  /**
   * 获取统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      totalRules: this.mappingRules.size
    };
  }

  // ========== 私有方法 ==========

  /**
   * 验证映射规则
   * @private
   * @param {Object} rule - 映射规则
   * @throws {Error} - 验证失败时抛出错误
   */
  _validateRule(rule) {
    if (!rule) {
      throw new Error('映射规则不能为空');
    }

    if (!rule.from || typeof rule.from !== 'string') {
      throw new Error('映射规则必须包含有效的 from 字段（字符串）');
    }

    if (!rule.to || !Array.isArray(rule.to)) {
      throw new Error('映射规则必须包含有效的 to 字段（数组）');
    }

    if (rule.to.length === 0) {
      throw new Error('to 字段不能为空数组');
    }

    if (rule.to.some(phase => typeof phase !== 'string')) {
      throw new Error('to 字段中的所有元素必须是字符串');
    }

    if (rule.condition && typeof rule.condition !== 'function') {
      throw new Error('condition 必须是一个函数');
    }

    if (rule.weight !== undefined && typeof rule.weight !== 'number') {
      throw new Error('weight 必须是一个数字');
    }
  }

  /**
   * 查找匹配的规则
   * @private
   * @param {string} fromPhase - 源阶段
   * @returns {Array<Object>} - 匹配的规则列表
   */
  _findMatchingRules(fromPhase) {
    return Array.from(this.mappingRules.values())
      .filter(rule => rule.from === fromPhase);
  }
}

/**
 * 创建 PhaseMapper 实例
 * @returns {PhaseMapper} - PhaseMapper 实例
 */
export function createPhaseMapper() {
  return new PhaseMapper();
}
