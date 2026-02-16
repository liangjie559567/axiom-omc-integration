/**
 * Axiom-OMC 整合插件
 * Claude Code 插件入口
 */

import { createAgentSystem } from './agents/agent-system.js';
import { createCommandRouter } from './core/command-router.js';
import { createStateSynchronizer } from './core/state-synchronizer.js';
import { createMemorySystem } from './core/memory-system.js';
import { createWorkflowIntegration } from './core/workflow-integration.js';
import { createCLISystem } from './cli/cli-system.js';
import { Logger } from './core/logger.js';

const logger = new Logger('Plugin');

/**
 * 插件类
 */
export class AxiomOMCPlugin {
  constructor(config = {}) {
    this.config = {
      name: 'axiom-omc',
      version: '1.0.0',
      description: 'Axiom-OMC 整合插件',
      ...config
    };

    // 核心系统
    this.agentSystem = null;
    this.commandRouter = null;
    this.stateSynchronizer = null;
    this.memorySystem = null;
    this.workflowIntegration = null;
    this.cliSystem = null;

    // 插件状态
    this.initialized = false;
    this.active = false;

    logger.info('插件已创建', {
      name: this.config.name,
      version: this.config.version
    });
  }

  /**
   * 初始化插件
   */
  async initialize() {
    if (this.initialized) {
      logger.warn('插件已初始化');
      return;
    }

    try {
      logger.info('开始初始化插件...');

      // 初始化核心系统
      this.agentSystem = createAgentSystem(this.config.agent);
      this.commandRouter = createCommandRouter(this.config.router);
      this.stateSynchronizer = createStateSynchronizer(this.config.sync);
      this.memorySystem = createMemorySystem(this.config.memory);
      this.workflowIntegration = createWorkflowIntegration(this.config.workflow);

      // 初始化记忆系统
      await this.memorySystem.initialize();

      // 初始化 CLI 系统
      this.cliSystem = createCLISystem({
        agent: this.config.agent,
        router: this.config.router,
        sync: this.config.sync,
        memory: this.config.memory,
        workflow: this.config.workflow
      });

      await this.cliSystem.initialize();

      this.initialized = true;
      logger.info('插件初始化完成');
    } catch (error) {
      logger.error('插件初始化失败', error);
      throw error;
    }
  }

  /**
   * 激活插件
   */
  async activate() {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.active) {
      logger.warn('插件已激活');
      return;
    }

    try {
      logger.info('激活插件...');

      // 注册插件命令
      this._registerPluginCommands();

      // 启动自动同步（如果配置）
      if (this.config.sync?.autoSync) {
        this.stateSynchronizer.startAutoSync();
      }

      this.active = true;
      logger.info('插件已激活');
    } catch (error) {
      logger.error('插件激活失败', error);
      throw error;
    }
  }

  /**
   * 停用插件
   */
  async deactivate() {
    if (!this.active) {
      logger.warn('插件未激活');
      return;
    }

    try {
      logger.info('停用插件...');

      // 停止自动同步
      this.stateSynchronizer.stopAutoSync();

      // 保存所有数据
      await this.memorySystem.saveAll();

      this.active = false;
      logger.info('插件已停用');
    } catch (error) {
      logger.error('插件停用失败', error);
      throw error;
    }
  }

  /**
   * 销毁插件
   */
  async destroy() {
    if (this.active) {
      await this.deactivate();
    }

    try {
      logger.info('销毁插件...');

      // 清理所有系统
      if (this.cliSystem) {
        await this.cliSystem.destroy();
      }

      if (this.stateSynchronizer) {
        this.stateSynchronizer.destroy();
      }

      if (this.memorySystem) {
        await this.memorySystem.destroy();
      }

      if (this.workflowIntegration) {
        this.workflowIntegration.destroy();
      }

      this.initialized = false;
      logger.info('插件已销毁');
    } catch (error) {
      logger.error('插件销毁失败', error);
      throw error;
    }
  }

  /**
   * 注册插件命令
   * @private
   */
  _registerPluginCommands() {
    // 使用 CLI 系统的命令路由器
    const router = this.cliSystem.commandRouter;

    // 插件信息命令
    router.register('plugin:info', async () => {
      return {
        success: true,
        plugin: {
          name: this.config.name,
          version: this.config.version,
          description: this.config.description,
          initialized: this.initialized,
          active: this.active
        }
      };
    }, {
      description: '查看插件信息'
    });

    // 插件状态命令
    router.register('plugin:status', async () => {
      return {
        success: true,
        status: {
          initialized: this.initialized,
          active: this.active,
          systems: {
            agentSystem: !!this.agentSystem,
            commandRouter: !!this.commandRouter,
            stateSynchronizer: !!this.stateSynchronizer,
            memorySystem: !!this.memorySystem,
            workflowIntegration: !!this.workflowIntegration,
            cliSystem: !!this.cliSystem
          }
        }
      };
    }, {
      description: '查看插件状态'
    });

    // 插件重载命令
    router.register('plugin:reload', async () => {
      await this.deactivate();
      await this.activate();

      return {
        success: true,
        message: '插件已重载'
      };
    }, {
      description: '重载插件'
    });

    logger.info('插件命令已注册');
  }

  /**
   * 执行命令
   */
  async executeCommand(commandLine) {
    if (!this.active) {
      throw new Error('插件未激活');
    }

    return this.cliSystem.execute(commandLine);
  }

  /**
   * 获取插件信息
   */
  getInfo() {
    return {
      name: this.config.name,
      version: this.config.version,
      description: this.config.description,
      initialized: this.initialized,
      active: this.active
    };
  }

  /**
   * 获取插件状态
   */
  getStatus() {
    return {
      initialized: this.initialized,
      active: this.active,
      systems: {
        agentSystem: !!this.agentSystem,
        commandRouter: !!this.commandRouter,
        stateSynchronizer: !!this.stateSynchronizer,
        memorySystem: !!this.memorySystem,
        workflowIntegration: !!this.workflowIntegration,
        cliSystem: !!this.cliSystem
      }
    };
  }
}

/**
 * 创建插件实例
 */
export function createPlugin(config) {
  return new AxiomOMCPlugin(config);
}

/**
 * 插件导出（用于 Claude Code 插件系统）
 */
export default {
  name: 'axiom-omc',
  version: '1.0.0',
  description: 'Axiom-OMC 整合插件',

  /**
   * 插件激活
   */
  async activate(context) {
    const plugin = createPlugin(context.config);
    await plugin.activate();
    return plugin;
  },

  /**
   * 插件停用
   */
  async deactivate(plugin) {
    if (plugin) {
      await plugin.deactivate();
    }
  }
};
