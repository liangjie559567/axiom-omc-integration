/**
 * Team 协调系统 - 多 Agent 团队协作和阶段路由
 *
 * 功能概述：
 * - 团队生命周期管理（创建、删除、状态查询）
 * - 任务管理（创建、列表、获取、更新）
 * - 阶段路由（5 个阶段的自动转换）
 * - 状态持久化（.omc/state/team-state.json）
 * - 消息传递（团队成员间通信）
 *
 * 使用示例：
 * ```javascript
 * const { createTeam, createTask, executePhase } = require('./team-coordinator');
 *
 * // 1. 创建团队
 * const team = await createTeam('feature-team', '实现用户认证功能', {
 *   maxFixAttempts: 3
 * });
 *
 * // 2. 创建任务
 * const task = await createTask('feature-team', {
 *   description: '实现 JWT 认证',
 *   priority: 'high'
 * });
 *
 * // 3. 执行阶段
 * await executePhase('feature-team', 'team-plan');
 * await executePhase('feature-team', 'team-prd');
 * await executePhase('feature-team', 'team-exec');
 *
 * // 4. 查询状态
 * const status = await getTeamStatus('feature-team');
 * console.log(status.currentPhase); // 'team-exec'
 * ```
 *
 * 阶段转换规则：
 * - team-plan → team-prd: 规划完成
 * - team-prd → team-exec: PRD 生成完成
 * - team-exec → team-verify: 所有任务完成
 * - team-verify → team-fix 或 complete: 根据验证结果
 * - team-fix → team-exec 或 team-verify: 根据修复结果
 * - 最多 3 次 fix 循环，超过则标记为 failed
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 阶段路由定义
const PHASE_ROUTING = {
  'team-plan': {
    agents: ['explore', 'planner'],
    models: { explore: 'haiku', planner: 'opus' },
    description: '探索代码库并制定计划',
    nextPhase: 'team-prd',
    allowedTransitions: ['team-prd']
  },
  'team-prd': {
    agents: ['analyst'],
    models: { analyst: 'opus' },
    description: '生成产品需求文档',
    nextPhase: 'team-exec',
    allowedTransitions: ['team-exec', 'team-plan']
  },
  'team-exec': {
    agents: ['executor'],
    models: { executor: 'sonnet' },
    description: '执行代码实现',
    nextPhase: 'team-verify',
    allowedTransitions: ['team-verify']
  },
  'team-verify': {
    agents: ['verifier', 'code-reviewer'],
    models: { verifier: 'sonnet', 'code-reviewer': 'opus' },
    description: '验证和审查代码',
    nextPhase: 'team-fix',
    terminalCondition: 'all_tests_pass',
    allowedTransitions: ['team-fix', 'complete', 'failed']
  },
  'team-fix': {
    agents: ['executor', 'debugger'],
    models: { executor: 'sonnet', debugger: 'sonnet' },
    description: '修复缺陷',
    nextPhase: 'team-exec',
    maxAttempts: 3,
    allowedTransitions: ['team-exec', 'team-verify', 'complete', 'failed']
  }
};

// 终止状态
const TERMINAL_STATES = ['complete', 'failed', 'cancelled'];

/**
 * Team 协调器类
 */
class TeamCoordinator {
  constructor() {
    this.teams = new Map();
    this.stateDir = path.join(process.cwd(), '.omc', 'state');
    this.stateFile = path.join(this.stateDir, 'team-state.json');
  }

  /**
   * 初始化：加载已有团队状态
   */
  async initialize() {
    try {
      await fs.mkdir(this.stateDir, { recursive: true });

      try {
        const data = await fs.readFile(this.stateFile, 'utf-8');
        const state = JSON.parse(data);

        // 恢复团队状态到内存
        if (state.teams) {
          Object.entries(state.teams).forEach(([name, teamState]) => {
            this.teams.set(name, teamState);
          });
        }

        console.log(`[TeamCoordinator] 已加载 ${this.teams.size} 个团队状态`);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error('[TeamCoordinator] 加载状态文件失败:', err.message);
        }
      }
    } catch (err) {
      console.error('[TeamCoordinator] 初始化失败:', err.message);
      throw err;
    }
  }

  /**
   * 保存团队状态到文件
   */
  async saveState() {
    try {
      const state = {
        teams: Object.fromEntries(this.teams),
        lastUpdated: new Date().toISOString()
      };

      await fs.writeFile(this.stateFile, JSON.stringify(state, null, 2), 'utf-8');
      console.log(`[TeamCoordinator] 状态已保存: ${this.teams.size} 个团队`);
    } catch (err) {
      console.error('[TeamCoordinator] 保存状态失败:', err.message);
      throw err;
    }
  }

  /**
   * 创建团队
   * @param {string} name - 团队名称
   * @param {string} description - 团队描述
   * @param {Object} options - 配置选项
   * @returns {Object} 团队对象
   */
  async createTeam(name, description, options = ) {
    if (this.teams.has(name)) {
      throw new Error(`团队 "${name}" 已存在`);
    }

    const team = {
      teamName: name,
      description,
      currentPhase: 'team-plan',
      tasks: [],
      fixLoopCount: 0,
      maxFixAttempts: options.maxFixAttempts || 3,
      stageHistory: [
        {
          phase: 'team-plan',
          enteredAt: new Date().toISOString(),
          status: 'active'
        }
      ],
      linkedRalph: options.linkedRalph || null,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: options.metadata ||
    };

    this.teams.set(name, team);
    await this.saveState();

    console.log(`[TeamCoordinator] 团队已创建: ${name} (阶段: ${team.currentPhase})`);
    return team;
  }

  /**
   * 删除团队
   * @param {string} teamName - 团队名称
   */
  async deleteTeam(teamName) {
    if (!this.teams.has(teamName)) {
      throw new Error(`团队 "${teamName}" 不存在`);
    }

    this.teams.delete(teamName);
    await this.saveState();

    console.log(`[TeamCoordinator] 团队已删除: ${teamName}`);
  }

  /**
   * 获取团队状态
   * @param {string} teamName - 团队名称
   * @returns {Object} 团队状态
   */
  getTeamStatus(teamName) {
    if (!this.teams.has(teamName)) {
      throw new Error(`团队 "${teamName}" 不存在`);
    }

    return { ...this.teams.get(teamName) };
  }

  /**
   * 创建任务
   * @param {string} teamName - 团队名称
   * @param {Object} task - 任务对象
   * @returns {Object} 创建的任务
   */
  async createTask(teamName, task) {
    const team = this.teams.get(teamName);
    if (!team) {
      throw new Error(`团队 "${teamName}" 不存在`);
    }

    const newTask = {
      taskId: uuidv4(),
      teamName,
      description: task.description,
      status: 'pending',
      priority: task.priority || 'normal',
      assignedAgent: null,
      result: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: task.metadata || {}
    };

    team.tasks.push(newTask);
    team.updatedAt = new Date().toISOString();
    await this.saveState();

    console.log(`[TeamCoordinator] [${teamName}] 任务已创建: ${newTask.taskId}`);
    return newTask;
  }

  /**
   * 列出任务
   * @param {string} teamName - 团队名称
   * @param {Object} filters - 过滤条件
   * @returns {Array} 任务列表
   */
  listTasks(teamName, filters = {}) {
    const team = this.teams.get(teamName);
    if (!team) {
      throw new Error(`团队 "${teamName}" 不存在`);
    }

    let tasks = [...team.tasks];

    // 应用过滤器
    if (filters.status) {
      tasks = tasks.filter(t => t.status === filters.status);
    }
    if (filters.assignedAgent) {
      tasks = tasks.filter(t => t.assignedAgent === filters.assignedAgent);
    }
    if (filters.priority) {
      tasks = tasks.filter(t => t.priority === filters.priority);
    }

    return tasks;
  }

  /**
   * 获取任务
   * @param {string} teamName - 团队名称
   * @param {string} taskId - 任务 ID
   * @returns {Object} 任务对象
   */
  getTask(teamName, taskId) {
    const team = this.teams.get(teamName);
    if (!team) {
      throw new Error(`团队 "${teamName}" 不存在`);
    }

    const task = team.tasks.find(t => t.taskId === taskId);
    if (!task) {
      throw new Error(`任务 "${taskId}" 不存在`);
    }

    return { ...task };
  }

  /**
   * 更新任务
   * @param {string} teamName - 团队名称
   * @param {string} taskId - 任务 ID
   * @param {Object} updates - 更新内容
   * @returns {Object} 更新后的任务
   */
  async updateTask(teamName, taskId, updates) {
    const team = this.teams.get(teamName);
    if (!team) {
      throw new Error(`团队 "${teamName}" 不存在`);
    }

    const task = team.tasks.find(t => t.taskId === taskId);
    if (!task) {
      throw new Error(`任务 "${taskId}" 不存在`);
    }

    // 更新任务字段
    Object.assign(task, updates, {
      updatedAt: new Date().toISOString()
    });

    team.updatedAt = new Date().toISOString();
    await this.saveState();

    console.log(`[TeamCoordinator] [${teamName}] 任务已更新: ${taskId} (状态: ${task.status})`);
    return { ...task };
  }

  /**
   * 执行阶段
   * @param {string} teamName - 团队名称
   * @param {string} phase - 阶段名称
   * @returns {Object} 执行结果
   */
  async executePhase(teamName, phase) {
    const team = this.teams.get(teamName);
    if (!team) {
      throw new Error(`团队 "${teamName}" 不存在`);
    }

    const phaseConfig = PHASE_ROUTING[phase];
    if (!phaseConfig) {
      throw new Error(`未知阶段: ${phase}`);
    }

    console.log(`[TeamCoordinator] [${teamName}] 执行阶段: ${phase} - ${phaseConfig.description}`);

    // TODO: 调用 Agent（等待 agent-manager.js 实现）
    // const { callAgent } = require('./agent-manager');
    //
    // for (const agentName of phaseConfig.agents) {
    //   const model = phaseConfig.models[agentName];
    //   const result = await callAgent(agentName, {
    //     teamName,
    //     phase,
    //     model,
    //     context: team
    //   });
    //
    //   // 记录 Agent 执行结果
    //   console.log(`[TeamCoordinator] [${teamName}] Agent ${agentName} 完成`);
    // }

    // 占位符：模拟 Agent 执行
    const result = {
      phase,
      agents: phaseConfig.agents,
      status: 'completed',
      executedAt: new Date().toISOString(),
      message: `阶段 ${phase} 执行完成（占位符实现）`
    };

    // 更新阶段历史
    const currentStage = team.stageHistory[team.stageHistory.length - 1];
    currentStage.status = 'completed';
    currentStage.completedAt = new Date().toISOString();

    team.updatedAt = new Date().toISOString();
    await this.saveState();

    return result;
  }

  /**
   * 阶段转换
   * @param {string} teamName - 团队名称
   * @param {string} toPhase - 目标阶段
   * @param {Object} options - 转换选项
   * @returns {Object} 转换结果
   */
  async transitionPhase(teamName, toPhase, options = {}) {
    const team = this.teams.get(teamName);
    if (!team) {
      throw new Error(`团队 "${teamName}" 不存在`);
    }

    const fromPhase = team.currentPhase;

    // 检查是否为终止状态
    if (TERMINAL_STATES.includes(fromPhase)) {
      throw new Error(`团队已处于终止状态: ${fromPhase}`);
    }

    // 验证转换合法性
    const fromConfig = PHASE_ROUTING[fromPhase];
    if (fromConfig && !fromConfig.allowedTransitions.includes(toPhase)) {
      throw new Error(`非法转换: ${fromPhase} → ${toPhase}`);
    }

    // 特殊处理：team-fix 循环计数
    if (toPhase === 'team-fix') {
      team.fixLoopCount++;

      if (team.fixLoopCount > team.maxFixAttempts) {
        console.log(`[TeamCoordinator] [${teamName}] 超过最大修复次数 (${team.maxFixAttempts})，标记为失败`);
        toPhase = 'failed';
      }
    } else if (toPhase === 'team-exec' && fromPhase === 'team-fix') {
      // 从 fix 返回 exec，不重置计数（累计）
    } else if (toPhase === 'complete') {
      // 成功完成，重置计数
      team.fixLoopCount = 0;
    }

    // 更新当前阶段
    team.currentPhase = toPhase;

    // 记录阶段历史
    team.stageHistory.push({
      phase: toPhase,
      enteredAt: new Date().toISOString(),
      status: TERMINAL_STATES.includes(toPhase) ? toPhase : 'active',
      fromPhase,
      reason: options.reason || null
    });

    // 如果进入终止状态，标记团队为非活跃
    if (TERMINAL_STATES.includes(toPhase)) {
      team.active = false;
    }

    team.updatedAt = new Date().toISOString();
    await this.saveState();

    console.log(`[TeamCoordinator] [${teamName}] 阶段转换: ${fromPhase} → ${toPhase}`);

    return {
      teamName,
      fromPhase,
      toPhase,
      fixLoopCount: team.fixLoopCount,
      active: team.active,
      transitionedAt: new Date().toISOString()
    };
  }

  /**
   * 发送消息
   * @param {string} teamName - 团队名称
   * @param {Object} message - 消息对象
   * @returns {Object} 发送结果
   */
  async sendMessage(teamName, message) {
    const team = this.teams.get(teamName);
    if (!team) {
      throw new Error(`团队 "${teamName}" 不存在`);
    }

    // 处理特殊消息：shutdown_request
    if (message.type === 'shutdown_request') {
      console.log(`[TeamCoordinator] [${teamName}] 收到关闭请求`);

      // 标记为取消状态
      await this.transitionPhase(teamName, 'cancelled', {
        reason: 'shutdown_request'
      });

      return {
        teamName,
        messageType: 'shutdown_request',
        status: 'cancelled',
        timestamp: new Date().toISOString()
      };
    }

    // 记录消息历史（可选）
    if (!team.messageHistory) {
      team.messageHistory = [];
    }

    team.messageHistory.push({
      ...message,
      timestamp: new Date().toISOString()
    });

    team.updatedAt = new Date().toISOString();
    await this.saveState();

    console.log(`[TeamCoordinator] [${teamName}] 消息已发送: ${message.type || 'general'}`);

    return {
      teamName,
      messageId: uuidv4(),
      status: 'sent',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取所有活跃团队
   * @returns {Array} 活跃团队列表
   */
  getActiveTeams() {
    return Array.from(this.teams.values()).filter(team => team.active);
  }

  /**
   * 恢复团队（从终止状态恢复）
   * @param {string} teamName - 团队名称
   * @param {string} toPhase - 恢复到的阶段
   */
  async resumeTeam(teamName, toPhase = 'team-plan') {
    const team = this.teams.get(teamName);
    if (!team) {
      throw new Error(`团队 "${teamName}" 不存在`);
    }

    if (team.active) {
      throw new Error(`团队 "${teamName}" 已处于活跃状态`);
    }

    team.active = true;
    team.currentPhase = toPhase;
    team.fixLoopCount = 0;

    team.stageHistory.push({
      phase: toPhase,
      enteredAt: new Date().toISOString(),
      status: 'active',
      fromPhase: team.stageHistory[team.stageHistory.length - 1].phase,
      reason: 'resumed'
    });

    team.updatedAt = new Date().toISOString();
    await this.saveState();

    console.log(`[TeamCoordinator] [${teamName}] 团队已恢复: ${toPhase}`);
  }
}

// 单例实例
let coordinatorInstance = null;

/**
 * 获取协调器实例
 */
async function getCoordinator() {
  if (!coordinatorInstance) {
    coordinatorInstance = new TeamCoordinator();
    await coordinatorInstance.initialize();
  }
  return coordinatorInstance;
}

/**
 * 导出的便捷函数
 */

async function createTeam(name, description, options = {}) {
  const coordinator = await getCoordinator();
  return coordinator.createTeam(name, description, options);
}

async function deleteTeam(teamName) {
  const coordinator = await getCoordinator();
  return coordinator.deleteTeam(teamName);
}

async function getTeamStatus(teamName) {
  const coordinator = await getCoordinator();
  return coordinator.getTeamStatus(teamName);
}

async function createTask(teamName, task) {
  const coordinator = await getCoordinator();
  return coordinator.createTask(teamName, task);
}

async function listTasks(teamName, filters = {}) {
  const coordinator = await getCoordinator();
  return coordinator.listTasks(teamName, filters);
}

async function getTask(teamName, taskId) {
  const coordinator = await getCoordinator();
  return coordinator.getTask(teamName, taskId);
}

async function updateTask(teamName, taskId, updates) {
  const coordinator = await getCoordinator();
  return coordinator.updateTask(teamName, taskId, updates);
}

async function executePhase(teamName, phase) {
  const coordinator = await getCoordinator();
  return coordinator.executePhase(teamName, phase);
}

async function transitionPhase(teamName, toPhase, options = {}) {
  const coordinator = await getCoordinator();
  return coordinator.transitionPhase(teamName, toPhase, options);
}

async function sendMessage(teamName, message) {
  const coordinator = await getCoordinator();
  return coordinator.sendMessage(teamName, message);
}

async function getActiveTeams() {
  const coordinator = await getCoordinator();
  return coordinator.getActiveTeams();
}

async function resumeTeam(teamName, toPhase) {
  const coordinator = await getCoordinator();
  return coordinator.resumeTeam(teamName, toPhase);
}

module.exports = {
  TeamCoordinator,
  PHASE_ROUTING,
  TERMINAL_STATES,
  getCoordinator,
  createTeam,
  deleteTeam,
  getTeamStatus,
  createTask,
  listTasks,
  getTask,
  updateTask,
  executePhase,
  transitionPhase,
  sendMessage,
  getActiveTeams,
  resumeTeam
};
