/**
 * /workflow 命令实现
 * 用于管理和执行工作流
 */

import { getAgentSystem } from '../agents/agent-system.js';
import { Logger } from '../core/logger.js';
import { readFile, writeFile } from 'fs/promises';

const logger = new Logger('WorkflowCommand');

/**
 * Workflow 命令处理器
 */
export class WorkflowCommand {
  constructor() {
    this.system = getAgentSystem();
  }

  /**
   * 执行命令
   * @param {string} subcommand - 子命令
   * @param {Array<string>} args - 参数
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 执行结果
   */
  async execute(subcommand, args = [], options = {}) {
    switch (subcommand) {
      case 'create':
        return this.create(args[0], options);

      case 'run':
      case 'execute':
        return this.run(args[0], options);

      case 'list':
        return this.list(options);

      case 'info':
      case 'status':
        return this.info(args[0], options);

      case 'cancel':
        return this.cancel(args[0], options);

      case 'template':
        return this.template(args[0], options);

      case 'validate':
        return this.validate(args[0], options);

      default:
        throw new Error(`未知的子命令: ${subcommand}`);
    }
  }

  /**
   * 创建工作流
   * @param {string} definitionPath - 工作流定义文件路径
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 创建结果
   */
  async create(definitionPath, options = {}) {
    if (!definitionPath) {
      throw new Error('请指定工作流定义文件');
    }

    // 读取工作流定义
    const definition = await this._loadDefinition(definitionPath);

    // 验证定义
    this._validateDefinition(definition);

    // 创建工作流
    const workflowId = this.system.workflowEngine.createWorkflow(definition);

    logger.info(`工作流已创建: ${workflowId}`, {
      name: definition.name,
      tasks: definition.tasks.length
    });

    return {
      success: true,
      workflowId,
      name: definition.name,
      tasks: definition.tasks.length
    };
  }

  /**
   * 执行工作流
   * @param {string} workflowIdOrPath - 工作流 ID 或定义文件路径
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 执行结果
   */
  async run(workflowIdOrPath, options = {}) {
    if (!workflowIdOrPath) {
      throw new Error('请指定工作流 ID 或定义文件');
    }

    let workflowId;

    // 判断是 ID 还是文件路径
    if (workflowIdOrPath.includes('.json') || workflowIdOrPath.includes('.js')) {
      // 文件路径，先创建工作流
      const createResult = await this.create(workflowIdOrPath, options);
      workflowId = createResult.workflowId;
    } else {
      // 工作流 ID
      workflowId = workflowIdOrPath;
    }

    // 准备上下文
    const context = options.context || {};

    logger.info(`开始执行工作流: ${workflowId}`);

    try {
      const result = await this.system.workflowEngine.executeWorkflow(
        workflowId,
        context
      );

      return {
        success: true,
        workflowId,
        result
      };
    } catch (error) {
      logger.error(`工作流执行失败: ${workflowId}`, error);
      return {
        success: false,
        workflowId,
        error: error.message
      };
    }
  }

  /**
   * 列出所有工作流
   * @param {Object} options - 选项
   * @returns {Object} - 工作流列表
   */
  list(options = {}) {
    const { status, format = 'table' } = options;

    const filters = {};
    if (status) {
      filters.status = status;
    }

    const workflows = this.system.workflowEngine.getWorkflows(filters);

    if (format === 'json') {
      return { workflows };
    }

    // 表格格式
    const table = workflows.map(wf => ({
      id: wf.id,
      name: wf.name,
      status: wf.status,
      tasks: wf.tasks.length,
      duration: wf.duration ? `${wf.duration}ms` : '-',
      createdAt: new Date(wf.createdAt).toISOString()
    }));

    return {
      total: workflows.length,
      workflows: table
    };
  }

  /**
   * 获取工作流信息
   * @param {string} workflowId - 工作流 ID
   * @param {Object} options - 选项
   * @returns {Object} - 工作流信息
   */
  info(workflowId, options = {}) {
    if (!workflowId) {
      throw new Error('请指定工作流 ID');
    }

    const workflow = this.system.workflowEngine.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`工作流不存在: ${workflowId}`);
    }

    const { detailed = false } = options;

    const info = {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      createdAt: new Date(workflow.createdAt).toISOString(),
      startedAt: workflow.startedAt ? new Date(workflow.startedAt).toISOString() : null,
      completedAt: workflow.completedAt ? new Date(workflow.completedAt).toISOString() : null,
      duration: workflow.duration ? `${workflow.duration}ms` : null,
      tasks: workflow.tasks.map(task => ({
        id: task.id,
        agent: task.agentId,
        status: task.status,
        dependencies: task.dependencies || []
      }))
    };

    if (detailed) {
      info.results = workflow.results;
      info.errors = workflow.errors;
      info.context = workflow.context;
    }

    return info;
  }

  /**
   * 取消工作流
   * @param {string} workflowId - 工作流 ID
   * @param {Object} options - 选项
   * @returns {Object} - 取消结果
   */
  cancel(workflowId, options = {}) {
    if (!workflowId) {
      throw new Error('请指定工作流 ID');
    }

    const cancelled = this.system.workflowEngine.cancelWorkflow(workflowId);

    if (cancelled) {
      logger.info(`工作流已取消: ${workflowId}`);
      return {
        success: true,
        workflowId,
        message: '工作流已取消'
      };
    } else {
      return {
        success: false,
        workflowId,
        message: '工作流不存在或未运行'
      };
    }
  }

  /**
   * 生成工作流模板
   * @param {string} templateName - 模板名称
   * @param {Object} options - 选项
   * @returns {Object} - 模板内容
   */
  template(templateName, options = {}) {
    const templates = {
      simple: this._getSimpleTemplate(),
      analysis: this._getAnalysisTemplate(),
      development: this._getDevelopmentTemplate(),
      review: this._getReviewTemplate()
    };

    const template = templates[templateName] || templates.simple;

    if (options.save) {
      // 保存到文件
      const filename = options.save === true
        ? `workflow-${templateName}.json`
        : options.save;

      return {
        template,
        message: `模板已生成，请保存到: ${filename}`
      };
    }

    return { template };
  }

  /**
   * 验证工作流定义
   * @param {string} definitionPath - 工作流定义文件路径
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 验证结果
   */
  async validate(definitionPath, options = {}) {
    if (!definitionPath) {
      throw new Error('请指定工作流定义文件');
    }

    try {
      const definition = await this._loadDefinition(definitionPath);
      this._validateDefinition(definition);

      return {
        valid: true,
        message: '工作流定义有效',
        definition: {
          name: definition.name,
          tasks: definition.tasks.length
        }
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * 加载工作流定义
   * @private
   * @param {string} path - 文件路径
   * @returns {Promise<Object>} - 工作流定义
   */
  async _loadDefinition(path) {
    try {
      const content = await readFile(path, 'utf-8');

      if (path.endsWith('.json')) {
        return JSON.parse(content);
      } else if (path.endsWith('.js')) {
        // 动态导入 JS 模块
        const module = await import(path);
        return module.default || module;
      } else {
        throw new Error('不支持的文件格式，请使用 .json 或 .js');
      }
    } catch (error) {
      throw new Error(`加载工作流定义失败: ${error.message}`);
    }
  }

  /**
   * 验证工作流定义
   * @private
   * @param {Object} definition - 工作流定义
   */
  _validateDefinition(definition) {
    if (!definition.name) {
      throw new Error('工作流定义缺少 name 字段');
    }

    if (!definition.tasks || !Array.isArray(definition.tasks)) {
      throw new Error('工作流定义缺少 tasks 字段或格式错误');
    }

    if (definition.tasks.length === 0) {
      throw new Error('工作流必须包含至少一个任务');
    }

    // 验证每个任务
    definition.tasks.forEach((task, index) => {
      if (!task.agentId) {
        throw new Error(`任务 ${index} 缺少 agentId 字段`);
      }

      // 验证 Agent 存在
      const agent = this.system.registry.getAgent(task.agentId);
      if (!agent) {
        throw new Error(`任务 ${index} 的 Agent 不存在: ${task.agentId}`);
      }
    });
  }

  /**
   * 获取简单模板
   * @private
   * @returns {Object} - 模板
   */
  _getSimpleTemplate() {
    return {
      name: 'Simple Workflow',
      description: '简单的单任务工作流',
      tasks: [
        {
          id: 'task1',
          agentId: 'oh-my-claudecode:explore',
          input: {
            target: 'src/',
            depth: 'medium'
          }
        }
      ]
    };
  }

  /**
   * 获取分析模板
   * @private
   * @returns {Object} - 模板
   */
  _getAnalysisTemplate() {
    return {
      name: 'Code Analysis Workflow',
      description: '代码分析工作流',
      tasks: [
        {
          id: 'explore',
          agentId: 'oh-my-claudecode:explore',
          input: {
            target: 'src/',
            depth: 'deep'
          }
        },
        {
          id: 'analyze',
          agentId: 'oh-my-claudecode:analyst',
          input: {
            requirement: 'Analyze code structure'
          },
          dependencies: ['explore']
        },
        {
          id: 'review',
          agentId: 'oh-my-claudecode:quality-reviewer',
          input: {
            code: '...'
          },
          dependencies: ['analyze']
        }
      ]
    };
  }

  /**
   * 获取开发模板
   * @private
   * @returns {Object} - 模板
   */
  _getDevelopmentTemplate() {
    return {
      name: 'Feature Development Workflow',
      description: '功能开发工作流',
      tasks: [
        {
          id: 'analyze',
          agentId: 'oh-my-claudecode:analyst',
          input: {
            requirement: 'Feature requirement'
          }
        },
        {
          id: 'plan',
          agentId: 'oh-my-claudecode:planner',
          input: {
            requirement: 'Feature requirement',
            acceptanceCriteria: []
          },
          dependencies: ['analyze']
        },
        {
          id: 'implement',
          agentId: 'oh-my-claudecode:executor',
          input: {
            task: 'Implement feature',
            specification: {}
          },
          dependencies: ['plan']
        },
        {
          id: 'test',
          agentId: 'oh-my-claudecode:testing-specialist',
          input: {
            code: '...',
            testType: 'unit'
          },
          dependencies: ['implement']
        }
      ]
    };
  }

  /**
   * 获取审查模板
   * @private
   * @returns {Object} - 模板
   */
  _getReviewTemplate() {
    return {
      name: 'Code Review Workflow',
      description: '代码审查工作流',
      tasks: [
        {
          id: 'style',
          agentId: 'oh-my-claudecode:style-reviewer',
          input: {
            code: '...'
          }
        },
        {
          id: 'quality',
          agentId: 'oh-my-claudecode:quality-reviewer',
          input: {
            code: '...'
          }
        },
        {
          id: 'security',
          agentId: 'oh-my-claudecode:security-reviewer',
          input: {
            code: '...'
          }
        },
        {
          id: 'performance',
          agentId: 'oh-my-claudecode:performance-reviewer',
          input: {
            code: '...'
          }
        }
      ]
    };
  }
}

/**
 * 创建 Workflow 命令实例
 * @returns {WorkflowCommand} - 命令实例
 */
export function createWorkflowCommand() {
  return new WorkflowCommand();
}
