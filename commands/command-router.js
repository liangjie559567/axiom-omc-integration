/**
 * Axiom + OMC 命令路由器
 * 根据命令类型路由到相应的系统处理，支持冲突解决和优先级管理
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * 系统类型枚举
 */
const SystemType = {
  OMC: 'omc',
  AXIOM: 'axiom',
  COLLABORATIVE: 'collaborative'
};

/**
 * 优先级枚举
 */
const Priority = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * 冲突解决策略
 */
const ConflictStrategy = {
  OMC_PRIORITY: 'omc_priority',
  AXIOM_PRIORITY: 'axiom_priority',
  LATEST: 'latest',
  MANUAL: 'manual'
};

/**
 * 命令路由器类
 */
class CommandRouter {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.configPath = path.join(projectRoot, '.agent', 'config', 'integration.yaml');
    this.historyPath = path.join(projectRoot, '.agent', 'logs', 'command_history.json');
    this.pythonScript = path.join(projectRoot, '.agent', 'scripts', 'command_router.py');
  }

  /**
   * 路由命令到相应系统
   * @param {string} command - 用户输入的命令
   * @returns {Object} - {system, priority}
   */
  route(command) {
    try {
      const result = execSync(
        `python "${this.pythonScript}" "${this.configPath}" "${command}" --history "${this.historyPath}"`,
        { encoding: 'utf-8', cwd: this.projectRoot }
      );

      // 解析 Python 脚本输出
      const lines = result.split('\n');
      const systemLine = lines.find(l => l.includes('系统:'));
      const priorityLine = lines.find(l => l.includes('优先级:'));

      return {
        system: systemLine ? systemLine.split(':')[1].trim() : SystemType.OMC,
        priority: priorityLine ? priorityLine.split(':')[1].trim() : Priority.LOW
      };
    } catch (error) {
      console.error('命令路由失败:', error.message);
      return { system: SystemType.OMC, priority: Priority.LOW };
    }
  }

  /**
   * 获取命令处理器信息
   * @param {string} command - 命令
   * @returns {Object} - 处理器信息
   */
  getHandler(command) {
    const { system, priority } = this.route(command);

    return {
      command,
      system,
      priority,
      sync_before: true,
      sync_after: true,
      description: this.getCommandDescription(command),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取命令描述
   * @param {string} command - 命令
   * @returns {string} - 描述
   */
  getCommandDescription(command) {
    const descriptions = {
      // OMC 命令
      '/autopilot': 'OMC 自动驾驶模式（全自动执行）',
      '/ralph': 'OMC 持久化执行循环',
      '/team': 'OMC Multi-Agent 协作',
      '/ultrawork': 'OMC 最大并行度执行',
      '/plan': 'OMC 任务规划',
      '/tdd': 'OMC 测试驱动开发',
      '/build-fix': 'OMC 构建修复',
      '/code-review': 'OMC 代码审查',

      // Axiom 命令
      '/start': '启动系统并加载上下文',
      '/prd': '生成产品需求文档',
      '/analyze-error': '分析错误并查询已知问题',
      '/evolve': '触发知识进化（提取模式、更新知识库）',
      '/reflect': '生成反思报告（分析决策、识别改进点）',
      '/patterns': '查看代码模式库',
      '/knowledge': '查询知识库',

      // 协同命令
      '/status': '查看系统状态',
      '/sync': '手动同步状态',
      '/rollback': '回滚到之前的状态'
    };

    return descriptions[command] || '未知命令';
  }

  /**
   * 记录命令执行
   * @param {string} command - 命令
   * @param {string} status - 状态 (running | completed | failed)
   * @param {Object} metadata - 额外元数据
   */
  recordCommand(command, status = 'running', metadata = {}) {
    try {
      const history = this.loadHistory();
      const { system, priority } = this.route(command);

      history.push({
        command,
        system,
        priority,
        status,
        timestamp: new Date().toISOString(),
        metadata
      });

      // 保持历史记录在合理范围内（最多 100 条）
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }

      this.saveHistory(history);
    } catch (error) {
      console.error('记录命令失败:', error.message);
    }
  }

  /**
   * 加载命令历史
   * @returns {Array} - 命令历史
   */
  loadHistory() {
    try {
      if (fs.existsSync(this.historyPath)) {
        return JSON.parse(fs.readFileSync(this.historyPath, 'utf-8'));
      }
    } catch (error) {
      console.error('加载命令历史失败:', error.message);
    }
    return [];
  }

  /**
   * 保存命令历史
   * @param {Array} history - 命令历史
   */
  saveHistory(history) {
    try {
      const dir = path.dirname(this.historyPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.historyPath, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error('保存命令历史失败:', error.message);
    }
  }
}

module.exports = {
  CommandRouter,
  SystemType,
  Priority,
  ConflictStrategy
};
