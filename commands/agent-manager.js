/**
 * Axiom + OMC Agent 管理器
 * 负责 Agent 注册、调用、路由和状态追踪
 *
 * 使用示例：
 * ```javascript
 * const { AgentRegistry, callAgent, callAgentParallel } = require('./agent-manager');
 *
 * // 1. 创建 Agent 注册表
 * const registry = new AgentRegistry('/path/to/project');
 *
 * // 2. 获取 Agent 信息
 * const executor = registry.getAgent('executor');
 * console.log(executor.description); // "代码实现、重构、功能开发专家"
 *
 * // 3. 调用单个 Agent
 * const result = await callAgent('executor', '实现用户登录功能', {
 *   context: { files: ['src/auth.js'] },
 *   timeout: 60000
 * });
 *
 * // 4. 并行调用多个 Agent
 * const results = await callAgentParallel([
 *   { agentName: 'planner', task: '制定实现计划' },
 *   { agentName: 'executor', task: '实现核心功能' },
 *   { agentName: 'verifier', task: '验证功能正确性' }
 * ]);
 *
 * // 5. 链式调用 Agent
 * const chainResult = await executeAgentChain(['planner', 'executor', 'verifier'], '实现新功能');
 * ```
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Agent 注册表类
 * 管理所有 Agent 的定义和元数据
 */
class AgentRegistry {
  constructor(projectRoot) {
    this.projectRoot = projectRoot || process.cwd();
    this.configPath = path.join(this.projectRoot, '.omc', 'axiom-omc-integration', 'config', 'agents.json');
    this.agents = new Map();
    this.loadAgentDefinitions();
  }

  /**
   * 加载 Agent 定义
   * 从配置文件读取所有 Agent 定义并注册
   */
  loadAgentDefinitions() {
    try {
      if (!fs.existsSync(this.configPath)) {
        console.warn(`Agent 配置文件不存在: ${this.configPath}`);
        return;
      }

      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));

      if (!config.agents || typeof config.agents !== 'object') {
        console.warn('Agent 配置格式错误：缺少 agents 字段');
        return;
      }

      // 注册所有 Agent
      Object.entries(config.agents).forEach(([name, definition]) => {
        this.registerAgent(name, definition);
      });

      console.log(`成功加载 ${this.agents.size} 个 Agent 定义`);
    } catch (error) {
      console.error('加载 Agent 定义失败:', error.message);
    }
  }

  /**
   * 注册 Agent
   * @param {string} name - Agent 名称
   * @param {Object} definition - Agent 定义
   * @returns {boolean} - 注册是否成功
   */
  registerAgent(name, definition) {
    try {
      // 验证必需字段
      if (!definition.description || !definition.model || !definition.systemPrompt) {
        console.warn(`Agent ${name} 定义不完整，跳过注册`);
        return false;
      }

      // 添加默认值
      const agent = {
        name,
        description: definition.description,
        model: definition.model,
        systemPrompt: definition.systemPrompt,
        capabilities: definition.capabilities || [],
        priority: definition.priority || 'medium',
        registeredAt: new Date().toISOString()
      };

      this.agents.set(name, agent);
      return true;
    } catch (error) {
      console.error(`注册 Agent ${name} 失败:`, error.message);
      return false;
    }
  }

  /**
   * 获取 Agent 定义
   * @param {string} name - Agent 名称
   * @returns {Object|null} - Agent 定义，不存在则返回 null
   */
  getAgent(name) {
    const agent = this.agents.get(name);
    if (!agent) {
      console.warn(`Agent ${name} 不存在`);
      return null;
    }
    return { ...agent }; // 返回副本，避免外部修改
  }

  /**
   * 列出所有 Agent
   * @param {Object} filters - 过滤条件
   * @returns {Array} - Agent 列表
   */
  listAgents(filters = {}) {
    let agents = Array.from(this.agents.values());

    // 按优先级过滤
    if (filters.priority) {
      agents = agents.filter(a => a.priority === filters.priority);
    }

    // 按能力过滤
    if (filters.capability) {
      agents = agents.filter(a => a.capabilities.includes(filters.capability));
    }

    // 按模型过滤
    if (filters.model) {
      agents = agents.filter(a => a.model === filters.model);
    }

    return agents;
  }

  /**
   * 检查 Agent 是否存在
   * @param {string} name - Agent 名称
   * @returns {boolean} - 是否存在
   */
  hasAgent(name) {
    return this.agents.has(name);
  }

  /**
   * 获取 Agent 统计信息
   * @returns {Object} - 统计数据
   */
  getStats() {
    const agents = Array.from(this.agents.values());
    return {
      total: agents.length,
      byModel: {
        opus: agents.filter(a => a.model === 'opus').length,
        sonnet: agents.filter(a => a.model === 'sonnet').length,
        haiku: agents.filter(a => a.model === 'haiku').length
      },
      byPriority: {
        high: agents.filter(a => a.priority === 'high').length,
        medium: agents.filter(a => a.priority === 'medium').length,
        low: agents.filter(a => a.priority === 'low').length
      }
    };
  }
}

/**
 * 调用单个 Agent
 * @param {string} agentName - Agent 名称
 * @param {string} task - 任务描述
 * @param {Object} options - 调用选项
 * @returns {Promise<Object>} - 调用结果
 */
async function callAgent(agentName, task, options = {}) {
  const startTime = Date.now();
  const projectRoot = options.projectRoot || process.cwd();
  const registry = new AgentRegistry(projectRoot);

  try {
    // 1. 验证 Agent 存在
    if (!registry.hasAgent(agentName)) {
      throw new Error(`Agent ${agentName} 不存在`);
    }

    // 2. 获取 Agent 定义
    const agent = registry.getAgent(agentName);

    // 3. 记录调用到状态文件
    const callId = `${agentName}-${Date.now()}`;
    recordAgentCall(projectRoot, {
      callId,
      agentName,
      task,
      status: 'running',
      startTime: new Date().toISOString()
    });

    // 4. 构建调用参数
    // 注意：这里使用占位符，实际集成需要调用 Claude Code Task API
    // 或者通过 child_process 调用 Claude Code CLI
    const result = await executeAgentTask(agent, task, options);

    // 5. 更新状态
    const duration = Date.now() - startTime;
    recordAgentCall(projectRoot, {
      callId,
      agentName,
      task,
      status: 'completed',
      duration,
      result: result.output,
      endTime: new Date().toISOString()
    });

    return {
      agentName,
      task,
      result: result.output,
      status: 'completed',
      duration,
      callId
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Agent ${agentName} 调用失败:`, error.message);

    return {
      agentName,
      task,
      result: null,
      status: 'failed',
      error: error.message,
      duration,
      callId: `${agentName}-${Date.now()}`
    };
  }
}

/**
 * 并行调用多个 Agent
 * @param {Array} tasks - 任务列表 [{ agentName, task, options }, ...]
 * @returns {Promise<Array>} - 调用结果列表
 */
async function callAgentParallel(tasks) {
  const promises = tasks.map(t =>
    callAgent(t.agentName, t.task, t.options || {})
  );

  return Promise.all(promises);
}

/**
 * 获取 Agent 执行状态
 * @param {string} callId - 调用 ID
 * @param {string} projectRoot - 项目根目录
 * @returns {Object|null} - 状态信息
 */
function getAgentStatus(callId, projectRoot = process.cwd()) {
  try {
    const statePath = path.join(projectRoot, '.omc', 'state', 'agent-calls.json');

    if (!fs.existsSync(statePath)) {
      return null;
    }

    const calls = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    return calls.find(c => c.callId === callId) || null;
  } catch (error) {
    console.error('获取 Agent 状态失败:', error.message);
    return null;
  }
}

/**
 * 根据任务类型自动选择合适的 Agent
 * @param {string} taskType - 任务类型
 * @returns {string} - Agent 名称
 */
function selectAgentForTask(taskType) {
  const routingMap = {
    'implementation': 'executor',
    'planning': 'planner',
    'verification': 'verifier',
    'debugging': 'debugger',
    'review': 'code-reviewer',
    'refactoring': 'executor',
    'testing': 'verifier',
    'analysis': 'debugger'
  };

  return routingMap[taskType] || 'executor';
}

/**
 * 链式调用 Agent
 * @param {Array} chain - Agent 名称列表
 * @param {string} initialTask - 初始任务
 * @param {Object} options - 调用选项
 * @returns {Promise<Object>} - 最终结果
 */
async function executeAgentChain(chain, initialTask, options = {}) {
  let result = { output: initialTask };
  const results = [];

  for (const agentName of chain) {
    console.log(`执行 Agent 链: ${agentName}`);

    // 将上一个 Agent 的输出作为下一个 Agent 的输入
    const task = result.output || initialTask;
    result = await callAgent(agentName, task, options);

    results.push({
      agentName,
      task,
      result: result.result,
      status: result.status,
      duration: result.duration
    });

    // 如果某个 Agent 失败，终止链式调用
    if (result.status === 'failed') {
      console.error(`Agent 链在 ${agentName} 处失败，终止执行`);
      break;
    }
  }

  return {
    chain,
    initialTask,
    results,
    finalResult: result.result,
    totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
    status: results.every(r => r.status === 'completed') ? 'completed' : 'failed'
  };
}

/**
 * 执行 Agent 任务（占位符实现）
 * @param {Object} agent - Agent 定义
 * @param {string} task - 任务描述
 * @param {Object} options - 选项
 * @returns {Promise<Object>} - 执行结果
 *
 * 注意：这是占位符实现，实际集成需要：
 * 1. 调用 Claude Code Task API
 * 2. 或者通过 child_process 调用 Claude Code CLI
 * 3. 传递 agent.systemPrompt 作为系统提示词
 * 4. 传递 agent.model 指定使用的模型
 */
async function executeAgentTask(agent, task, options) {
  // TODO: 实际集成时替换为真实的 Claude Code API 调用
  // 示例：
  // const result = await claudeCodeAPI.createTask({
  //   systemPrompt: agent.systemPrompt,
  //   model: agent.model,
  //   task: task,
  //   context: options.context || {}
  // });

  console.log(`[占位符] 调用 Agent: ${agent.name}`);
  console.log(`[占位符] 模型: ${agent.model}`);
  console.log(`[占位符] 任务: ${task}`);

  // 模拟异步执行
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    output: `[占位符结果] Agent ${agent.name} 已处理任务: ${task}`,
    metadata: {
      model: agent.model,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * 记录 Agent 调用到状态文件
 * @param {string} projectRoot - 项目根目录
 * @param {Object} callData - 调用数据
 */
function recordAgentCall(projectRoot, callData) {
  try {
    const statePath = path.join(projectRoot, '.omc', 'state', 'agent-calls.json');
    const stateDir = path.dirname(statePath);

    // 确保目录存在
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }

    // 读取现有记录
    let calls = [];
    if (fs.existsSync(statePath)) {
      calls = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    }

    // 查找并更新或添加记录
    const existingIndex = calls.findIndex(c => c.callId === callData.callId);
    if (existingIndex >= 0) {
      calls[existingIndex] = { ...calls[existingIndex], ...callData };
    } else {
      calls.push(callData);
    }

    // 保持记录在合理范围内（最多 1000 条）
    if (calls.length > 1000) {
      calls = calls.slice(-1000);
    }

    // 写入文件
    fs.writeFileSync(statePath, JSON.stringify(calls, null, 2));
  } catch (error) {
    console.error('记录 Agent 调用失败:', error.message);
  }
}

/**
 * 核心 Agent 定义（从配置文件加载）
 */
const CORE_AGENTS = {
  executor: {
    name: 'executor',
    description: '代码实现、重构、功能开发专家',
    model: 'sonnet'
  },
  planner: {
    name: 'planner',
    description: '任务规划、执行计划制定、风险标记专家',
    model: 'opus'
  },
  verifier: {
    name: 'verifier',
    description: '完成验证、测试充分性检查、质量保证专家',
    model: 'sonnet'
  },
  debugger: {
    name: 'debugger',
    description: '根因分析、问题诊断、回归隔离专家',
    model: 'sonnet'
  },
  'code-reviewer': {
    name: 'code-reviewer',
    description: '全面代码审查、架构评估、最佳实践检查专家',
    model: 'opus'
  }
};

module.exports = {
  AgentRegistry,
  callAgent,
  callAgentParallel,
  getAgentStatus,
  selectAgentForTask,
  executeAgentChain,
  CORE_AGENTS
};
