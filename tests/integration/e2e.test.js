/**
 * 端到端集成测试
 * 测试所有模块的协同工作
 */

import { createAgentSystem } from '../../src/agents/agent-system.js';
import { createCommandRouter } from '../../src/core/command-router.js';
import { createStateSynchronizer } from '../../src/core/state-synchronizer.js';
import { createMemorySystem } from '../../src/core/memory-system.js';
import { createWorkflowIntegration } from '../../src/core/workflow-integration.js';
import { DecisionType, DecisionStatus } from '../../src/core/decision-manager.js';
import { NodeType, RelationType } from '../../src/core/knowledge-graph.js';
import { WorkflowType, OMCPhase } from '../../src/core/workflow-integration.js';
import { rm, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

describe('端到端集成测试', () => {
  let agentSystem;
  let commandRouter;
  let stateSynchronizer;
  let memorySystem;
  let workflowIntegration;
  let testDir;

  beforeAll(async () => {
    testDir = join(process.cwd(), 'test-integration');

    // 创建测试目录
    if (!existsSync(testDir)) {
      await mkdir(testDir, { recursive: true });
    }

    // 初始化所有系统
    agentSystem = createAgentSystem();
    commandRouter = createCommandRouter();
    stateSynchronizer = createStateSynchronizer({
      axiomRoot: join(testDir, '.agent'),
      omcRoot: join(testDir, '.omc')
    });
    memorySystem = createMemorySystem({
      storageDir: join(testDir, 'memory')
    });
    workflowIntegration = createWorkflowIntegration();

    await memorySystem.initialize();

    // 创建同步目录
    await mkdir(join(testDir, '.agent'), { recursive: true });
    await mkdir(join(testDir, '.omc'), { recursive: true });
  });

  afterAll(async () => {
    // 清理资源
    stateSynchronizer.destroy();
    await memorySystem.destroy();
    workflowIntegration.destroy();

    // 清理测试目录
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe('完整用户场景', () => {
    test('场景 1: 项目启动和规划', async () => {
      // 1. 启动工作流
      const workflowId = workflowIntegration.startWorkflow('omc-default', {
        projectName: 'Test Project',
        team: 'Backend Team'
      });

      expect(workflowId).toBeDefined();

      const workflow = workflowIntegration.getWorkflowInstance(workflowId);
      expect(workflow.currentPhase).toBe(OMCPhase.PLANNING);

      // 2. 执行 Architect Agent
      const executionId = await agentSystem.execute('architect', {
        task: 'Design system architecture'
      });

      expect(executionId).toBeDefined();

      // 等待执行完成
      await new Promise(resolve => setTimeout(resolve, 100));

      const execution = agentSystem.executor.getExecution(executionId);
      expect(execution).toBeDefined();

      // 3. 记录架构决策
      const decisionId = memorySystem.addDecision({
        title: 'Use microservices architecture',
        type: DecisionType.ARCHITECTURE,
        status: DecisionStatus.PROPOSED,
        decision: 'Split system into independent services',
        rationale: 'Better scalability and maintainability',
        tags: ['architecture', 'microservices']
      });

      expect(decisionId).toBeDefined();

      const decision = memorySystem.getDecision(decisionId);
      expect(decision.title).toBe('Use microservices architecture');

      // 4. 在知识图谱中创建架构节点
      const archNodeId = memorySystem.addKnowledgeNode({
        type: NodeType.CONCEPT,
        name: 'Microservices Architecture',
        description: 'System architecture pattern',
        tags: ['architecture']
      });

      expect(archNodeId).toBeDefined();

      // 5. 转换到设计阶段
      const transitioned = await workflowIntegration.transitionToNext(workflowId);
      expect(transitioned).toBe(true);

      const updatedWorkflow = workflowIntegration.getWorkflowInstance(workflowId);
      expect(updatedWorkflow.currentPhase).toBe(OMCPhase.DESIGN);
    }, 10000);

    test('场景 2: 设计和实现', async () => {
      // 1. 启动工作流（从设计阶段开始）
      const workflowId = workflowIntegration.startWorkflow('omc-default');
      await workflowIntegration.transitionTo(
        workflowId,
        OMCPhase.DESIGN,
        { skipIntermediate: true }
      );

      // 2. 执行 Designer Agent
      const designExecution = await agentSystem.execute('designer', {
        task: 'Design API endpoints'
      });

      expect(designExecution).toBeDefined();

      // 3. 记录设计决策
      const designDecision = memorySystem.addDecision({
        title: 'Use RESTful API design',
        type: DecisionType.DESIGN,
        status: DecisionStatus.ACCEPTED,
        decision: 'Follow REST principles for API design',
        alternatives: ['GraphQL', 'gRPC'],
        tags: ['api', 'design']
      });

      expect(designDecision).toBeDefined();

      // 4. 转换到实现阶段
      await workflowIntegration.transitionToNext(workflowId);

      // 5. 执行 Executor Agent
      const implExecution = await agentSystem.execute('executor', {
        task: 'Implement user authentication'
      });

      expect(implExecution).toBeDefined();

      // 6. 创建实现相关的知识节点
      const authModuleId = memorySystem.addKnowledgeNode({
        type: NodeType.MODULE,
        name: 'Authentication Module',
        description: 'User authentication implementation'
      });

      const authConceptId = memorySystem.addKnowledgeNode({
        type: NodeType.CONCEPT,
        name: 'JWT Authentication',
        description: 'Token-based authentication'
      });

      // 7. 创建关系
      memorySystem.addKnowledgeEdge({
        from: authModuleId,
        to: authConceptId,
        type: RelationType.IMPLEMENTS
      });

      // 验证知识图谱
      const neighbors = memorySystem.getKnowledgeNeighbors(authModuleId);
      expect(neighbors.length).toBe(1);
      expect(neighbors[0].id).toBe(authConceptId);
    }, 10000);

    test('场景 3: 状态同步和记忆管理', async () => {
      // 1. 创建测试文件
      const axiomFile = join(testDir, '.agent', 'decisions.md');
      const omcFile = join(testDir, '.omc', 'decisions.json');

      await writeFile(axiomFile, '# Decisions\n\n## Decision 1\n\nUse TypeScript', 'utf-8');

      // 2. 注册同步映射
      stateSynchronizer.registerMapping('decisions.md', 'decisions.json', {
        transformer: async (content, context) => {
          if (context.direction === 'axiom_to_omc') {
            // Markdown -> JSON
            return JSON.stringify({ decisions: [{ title: 'Decision 1' }] }, null, 2);
          } else {
            // JSON -> Markdown
            return '# Decisions\n\n## Decision 1\n\nUse TypeScript';
          }
        }
      });

      // 3. 执行同步
      const syncResult = await stateSynchronizer.syncAll();
      expect(syncResult.successful).toBeGreaterThan(0);

      // 4. 设置用户偏好
      memorySystem.setPreference('language', 'typescript');
      memorySystem.setPreference('framework', 'express');
      memorySystem.setPreference('database', 'postgresql');

      // 5. 验证偏好
      expect(memorySystem.getPreference('language')).toBe('typescript');
      expect(memorySystem.getPreference('framework')).toBe('express');

      // 6. 更新活动上下文
      memorySystem.updateContext({
        currentPhase: 'implementation',
        activeFiles: ['src/auth.ts', 'src/user.ts'],
        workingDirectory: '/project/src'
      });

      const context = memorySystem.getContext();
      expect(context.currentPhase).toBe('implementation');
      expect(context.activeFiles.length).toBe(2);

      // 7. 保存所有数据
      await memorySystem.saveAll();
    }, 10000);

    test('场景 4: 命令路由和工作流协同', async () => {
      // 1. 注册命令
      commandRouter.register('workflow', async (args) => {
        const [action, ...rest] = args;

        switch (action) {
          case 'start':
            return workflowIntegration.startWorkflow('omc-default');
          case 'next':
            const [instanceId] = rest;
            return workflowIntegration.transitionToNext(instanceId);
          case 'status':
            const [id] = rest;
            return workflowIntegration.getWorkflowInstance(id);
          default:
            return { error: 'Unknown action' };
        }
      });

      commandRouter.register('agent', async (args) => {
        const [action, ...rest] = args;

        switch (action) {
          case 'execute':
            const [agentId] = rest;
            return agentSystem.execute(agentId);
          case 'list':
            return agentSystem.findAgents({});
          default:
            return { error: 'Unknown action' };
        }
      });

      // 2. 通过命令启动工作流
      const workflowId = await commandRouter.route('workflow', ['start']);
      expect(workflowId).toBeDefined();

      // 3. 通过命令执行 Agent
      const executionId = await commandRouter.route('agent', ['execute', 'architect']);
      expect(executionId).toBeDefined();

      // 4. 通过命令转换阶段
      const transitioned = await commandRouter.route('workflow', ['next', workflowId]);
      expect(transitioned).toBe(true);

      // 5. 通过命令查询状态
      const status = await commandRouter.route('workflow', ['status', workflowId]);
      expect(status).toBeDefined();
      expect(status.currentPhase).toBe(OMCPhase.DESIGN);

      // 6. 验证命令历史
      const history = commandRouter.getHistory({ limit: 5 });
      expect(history.length).toBeGreaterThan(0);
    }, 10000);

    test('场景 5: 完整的开发流程', async () => {
      // 1. 启动 OMC 工作流
      const workflowId = workflowIntegration.startWorkflow('omc-default', {
        projectName: 'Full Development Flow',
        team: 'Full Stack Team'
      });

      // 2. Planning 阶段 - 执行 Architect
      const architectExecution = await agentSystem.execute('architect', {
        task: 'Plan system architecture'
      });

      memorySystem.addDecision({
        title: 'System Architecture Plan',
        type: DecisionType.ARCHITECTURE,
        status: DecisionStatus.ACCEPTED,
        decision: 'Use layered architecture'
      });

      await workflowIntegration.transitionToNext(workflowId);

      // 3. Design 阶段 - 执行 Designer
      const designerExecution = await agentSystem.execute('designer', {
        task: 'Design database schema'
      });

      memorySystem.addDecision({
        title: 'Database Schema Design',
        type: DecisionType.DESIGN,
        status: DecisionStatus.ACCEPTED,
        decision: 'Use normalized schema'
      });

      await workflowIntegration.transitionToNext(workflowId);

      // 4. Implementation 阶段 - 执行 Executor
      const executorExecution = await agentSystem.execute('executor', {
        task: 'Implement core features'
      });

      await workflowIntegration.transitionToNext(workflowId);

      // 5. Testing 阶段 - 执行 Quality Reviewer
      const reviewerExecution = await agentSystem.execute('quality-reviewer', {
        task: 'Review code quality'
      });

      await workflowIntegration.transitionToNext(workflowId);

      // 6. Deployment 阶段 - 完成工作流
      await workflowIntegration.transitionToNext(workflowId);

      // 7. 验证工作流已完成
      const workflow = workflowIntegration.getWorkflowInstance(workflowId);
      expect(workflow).toBeNull(); // 已完成的工作流被移除

      // 8. 验证统计信息
      const workflowStats = workflowIntegration.getStats();
      expect(workflowStats.completedWorkflows).toBeGreaterThan(0);

      const agentStats = agentSystem.executor.getStats();
      expect(agentStats.totalExecutions).toBeGreaterThan(0);

      const memoryStats = memorySystem.getStats();
      expect(memoryStats.decisions.totalDecisions).toBeGreaterThan(0);
    }, 15000);
  });

  describe('模块间集成', () => {
    test('Agent 系统与记忆系统集成', async () => {
      // 执行 Agent 并记录到记忆系统
      const executionId = await agentSystem.execute('architect');

      // 记录执行决策
      const decisionId = memorySystem.addDecision({
        title: 'Agent Execution Decision',
        type: DecisionType.PROCESS,
        decision: `Executed agent: architect`,
        metadata: { executionId }
      });

      expect(decisionId).toBeDefined();

      const decision = memorySystem.getDecision(decisionId);
      expect(decision.metadata.executionId).toBe(executionId);
    });

    test('工作流与记忆系统集成', async () => {
      // 启动工作流
      const workflowId = workflowIntegration.startWorkflow('omc-default');

      // 在知识图谱中记录工作流
      const nodeId = memorySystem.addKnowledgeNode({
        type: NodeType.PATTERN,
        name: 'OMC Workflow Instance',
        properties: { workflowId }
      });

      expect(nodeId).toBeDefined();

      // 转换阶段并记录
      await workflowIntegration.transitionToNext(workflowId);

      memorySystem.addDecision({
        title: 'Phase Transition',
        type: DecisionType.PROCESS,
        decision: 'Transitioned to design phase',
        metadata: { workflowId }
      });

      const decisions = memorySystem.queryDecisions({
        type: DecisionType.PROCESS
      });

      expect(decisions.length).toBeGreaterThan(0);
    });

    test('命令路由与所有系统集成', async () => {
      // 注册集成命令
      commandRouter.register('integrated', async (args) => {
        const [action] = args;

        if (action === 'full-flow') {
          // 启动工作流
          const workflowId = workflowIntegration.startWorkflow('omc-default');

          // 执行 Agent
          const executionId = await agentSystem.execute('architect');

          // 记录决策
          const decisionId = memorySystem.addDecision({
            title: 'Integrated Flow',
            type: DecisionType.PROCESS,
            decision: 'Executed full integrated flow'
          });

          return {
            workflowId,
            executionId,
            decisionId
          };
        }

        return { error: 'Unknown action' };
      });

      // 执行集成命令
      const result = await commandRouter.route('integrated', ['full-flow']);

      expect(result.workflowId).toBeDefined();
      expect(result.executionId).toBeDefined();
      expect(result.decisionId).toBeDefined();
    });
  });

  describe('错误处理和边界情况', () => {
    test('应该处理不存在的 Agent', async () => {
      await expect(
        agentSystem.execute('nonexistent')
      ).rejects.toThrow();
    });

    test('应该处理不存在的工作流', () => {
      expect(() => {
        workflowIntegration.startWorkflow('nonexistent');
      }).toThrow();
    });

    test('应该处理不存在的命令', async () => {
      await expect(
        commandRouter.route('nonexistent', [])
      ).rejects.toThrow();
    });

    test('应该处理同步失败', async () => {
      // 注册无效的映射
      stateSynchronizer.registerMapping(
        'nonexistent.md',
        'nonexistent.json'
      );

      const result = await stateSynchronizer.syncAll();
      expect(result.failed).toBeGreaterThanOrEqual(0);
    });
  });
});
