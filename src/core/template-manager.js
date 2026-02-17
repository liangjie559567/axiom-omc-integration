/**
 * TemplateManager - 模板管理器（最小版）
 *
 * 负责管理工作流模板，支持：
 * - 模板注册和验证
 * - 从模板创建工作流
 * - 预定义模板（MVP: 只有 TDD 模板）
 *
 * MVP 版本：只实现基础功能和 1 个模板
 */

import { Logger } from './logger.js';
import { generateId } from '../utils/index.js';

const logger = new Logger('TemplateManager');

/**
 * TemplateManager 类
 */
export class TemplateManager {
  /**
   * 构造函数
   * @param {Object} workflowIntegration - 工作流集成实例
   */
  constructor(workflowIntegration) {
    if (!workflowIntegration) {
      throw new Error('workflowIntegration 是必需的');
    }

    this.workflowIntegration = workflowIntegration;
    this.templates = new Map(); // 模板存储: templateId -> template
    this.stats = {
      totalTemplates: 0,
      totalCreated: 0
    };

    logger.info('TemplateManager 已初始化');
  }

  /**
   * 注册模板
   * @param {Object} template - 模板对象
   * @param {string} template.id - 模板 ID
   * @param {string} template.name - 模板名称
   * @param {string} template.description - 模板描述
   * @param {string} template.workflowId - 工作流 ID
   * @param {Array<Object>} template.phases - 阶段定义
   * @param {Object} template.defaultContext - 默认上下文（可选）
   * @returns {string} - 模板 ID
   */
  registerTemplate(template) {
    // 验证模板
    this._validateTemplate(template);

    // 检查是否已存在
    if (this.templates.has(template.id)) {
      throw new Error(`模板已存在: ${template.id}`);
    }

    // 存储模板
    const templateData = {
      ...template,
      createdAt: Date.now()
    };

    this.templates.set(template.id, templateData);
    this.stats.totalTemplates++;

    logger.info('模板已注册', {
      id: template.id,
      name: template.name,
      workflowId: template.workflowId
    });

    return template.id;
  }

  /**
   * 从模板创建工作流实例
   * @param {string} templateId - 模板 ID
   * @param {Object} params - 参数
   * @param {Object} params.context - 上下文（可选）
   * @param {Object} params.overrides - 覆盖配置（可选）
   * @returns {Promise<Object>} - 工作流实例
   */
  async createFromTemplate(templateId, params = {}) {
    // 获取模板
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`模板不存在: ${templateId}`);
    }

    // 合并上下文
    const context = {
      ...template.defaultContext,
      ...params.context,
      templateId,
      templateName: template.name
    };

    // 创建工作流实例
    const instanceId = await this.workflowIntegration.startWorkflow(
      template.workflowId,
      context
    );

    const instance = this.workflowIntegration.getWorkflowInstance(instanceId);

    this.stats.totalCreated++;

    logger.info('从模板创建工作流', {
      templateId,
      instanceId: instance.id,
      workflowId: template.workflowId
    });

    return instance;
  }

  /**
   * 获取模板
   * @param {string} templateId - 模板 ID
   * @returns {Object|null} - 模板对象
   */
  getTemplate(templateId) {
    return this.templates.get(templateId) || null;
  }

  /**
   * 获取所有模板
   * @returns {Array<Object>} - 模板列表
   */
  getAllTemplates() {
    return Array.from(this.templates.values());
  }

  /**
   * 删除模板
   * @param {string} templateId - 模板 ID
   * @returns {boolean} - 是否成功
   */
  deleteTemplate(templateId) {
    const deleted = this.templates.delete(templateId);
    if (deleted) {
      this.stats.totalTemplates--;
      logger.info('模板已删除', { templateId });
    }
    return deleted;
  }

  /**
   * 获取统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      totalTemplates: this.templates.size
    };
  }

  // ========== 私有方法 ==========

  /**
   * 验证模板
   * @private
   * @param {Object} template - 模板对象
   * @throws {Error} - 验证失败时抛出错误
   */
  _validateTemplate(template) {
    if (!template) {
      throw new Error('模板不能为空');
    }

    if (!template.id || typeof template.id !== 'string') {
      throw new Error('模板必须包含有效的 id 字段（字符串）');
    }

    if (!template.name || typeof template.name !== 'string') {
      throw new Error('模板必须包含有效的 name 字段（字符串）');
    }

    if (!template.description || typeof template.description !== 'string') {
      throw new Error('模板必须包含有效的 description 字段（字符串）');
    }

    if (!template.workflowId || typeof template.workflowId !== 'string') {
      throw new Error('模板必须包含有效的 workflowId 字段（字符串）');
    }

    if (!template.phases || !Array.isArray(template.phases)) {
      throw new Error('模板必须包含有效的 phases 字段（数组）');
    }

    if (template.phases.length === 0) {
      throw new Error('phases 字段不能为空数组');
    }

    // 验证每个阶段
    template.phases.forEach((phase, index) => {
      if (!phase.id || typeof phase.id !== 'string') {
        throw new Error(`阶段 ${index} 必须包含有效的 id 字段（字符串）`);
      }

      if (!phase.name || typeof phase.name !== 'string') {
        throw new Error(`阶段 ${index} 必须包含有效的 name 字段（字符串）`);
      }
    });
  }

  /**
   * 清理资源
   */
  destroy() {
    this.templates.clear();
    logger.info('TemplateManager 已销毁');
  }
}

/**
 * 创建 TemplateManager 实例
 * @param {Object} workflowIntegration - 工作流集成实例
 * @returns {TemplateManager} - TemplateManager 实例
 */
export function createTemplateManager(workflowIntegration) {
  return new TemplateManager(workflowIntegration);
}
