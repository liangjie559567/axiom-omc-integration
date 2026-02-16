/**
 * MemorySystem 单元测试
 */

import {
  MemorySystem,
  createMemorySystem
} from '../../src/core/memory-system.js';
import {
  DecisionType,
  DecisionStatus
} from '../../src/core/decision-manager.js';
import {
  NodeType,
  RelationType
} from '../../src/core/knowledge-graph.js';
import { rm, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

describe('MemorySystem', () => {
  let memorySystem;
  let testDir;

  beforeEach(async () => {
    testDir = join(process.cwd(), 'test-memory');

    memorySystem = new MemorySystem({
      storageDir: testDir
    });

    // 创建测试目录
    if (!existsSync(testDir)) {
      await mkdir(testDir, { recursive: true });
    }

    await memorySystem.initialize();
  });

  afterEach(async () => {
    await memorySystem.destroy();

    // 清理测试目录
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe('构造函数', () => {
    test('应该创建记忆系统实例', () => {
      expect(memorySystem).toBeDefined();
      expect(memorySystem.decisionManager).toBeDefined();
      expect(memorySystem.knowledgeGraph).toBeDefined();
    });

    test('应该使用默认配置', () => {
      expect(memorySystem.config.enablePatternExtraction).toBe(true);
      expect(memorySystem.config.patternThreshold).toBe(3);
    });
  });

  describe('initialize', () => {
    test('应该初始化所有组件', async () => {
      const system = new MemorySystem({
        storageDir: testDir
      });

      await system.initialize();

      expect(system.decisionManager.decisions).toBeDefined();
      expect(system.knowledgeGraph.nodes).toBeDefined();

      await system.destroy();
    });
  });

  describe('决策管理', () => {
    test('应该添加决策记录', () => {
      const id = memorySystem.addDecision({
        title: 'Test Decision',
        type: DecisionType.TECHNICAL,
        decision: 'Use TypeScript',
        rationale: 'Better type safety'
      });

      expect(id).toBeDefined();
      expect(memorySystem.decisionManager.decisions.has(id)).toBe(true);
    });

    test('应该更新决策记录', () => {
      const id = memorySystem.addDecision({
        title: 'Test Decision',
        decision: 'Use TypeScript'
      });

      const success = memorySystem.updateDecision(id, {
        status: DecisionStatus.ACCEPTED
      });

      expect(success).toBe(true);

      const decision = memorySystem.getDecision(id);
      expect(decision.status).toBe(DecisionStatus.ACCEPTED);
    });

    test('应该删除决策记录', () => {
      const id = memorySystem.addDecision({
        title: 'Test Decision',
        decision: 'Use TypeScript'
      });

      const success = memorySystem.deleteDecision(id);

      expect(success).toBe(true);
      expect(memorySystem.getDecision(id)).toBeNull();
    });

    test('应该查询决策记录', () => {
      memorySystem.addDecision({
        title: 'Decision 1',
        type: DecisionType.TECHNICAL,
        decision: 'Use TypeScript'
      });

      memorySystem.addDecision({
        title: 'Decision 2',
        type: DecisionType.ARCHITECTURE,
        decision: 'Use microservices'
      });

      const decisions = memorySystem.queryDecisions({
        type: DecisionType.TECHNICAL
      });

      expect(decisions.length).toBe(1);
      expect(decisions[0].type).toBe(DecisionType.TECHNICAL);
    });
  });

  describe('用户偏好', () => {
    test('应该设置用户偏好', () => {
      memorySystem.setPreference('theme', 'dark');

      const value = memorySystem.getPreference('theme');
      expect(value).toBe('dark');
    });

    test('应该获取默认值', () => {
      const value = memorySystem.getPreference('nonexistent', 'default');
      expect(value).toBe('default');
    });
  });

  describe('活动上下文', () => {
    test('应该更新活动上下文', () => {
      memorySystem.updateContext({
        currentPhase: 'implementation',
        workingDirectory: '/project'
      });

      const context = memorySystem.getContext();
      expect(context.currentPhase).toBe('implementation');
      expect(context.workingDirectory).toBe('/project');
    });

    test('应该获取活动上下文', () => {
      const context = memorySystem.getContext();
      expect(context).toBeDefined();
      expect(context.activeFiles).toBeDefined();
    });
  });

  describe('知识图谱', () => {
    test('应该添加知识节点', () => {
      const id = memorySystem.addKnowledgeNode({
        type: NodeType.CONCEPT,
        name: 'Authentication',
        description: 'User authentication system'
      });

      expect(id).toBeDefined();
      expect(memorySystem.knowledgeGraph.nodes.has(id)).toBe(true);
    });

    test('应该添加知识关系', () => {
      const node1 = memorySystem.addKnowledgeNode({
        type: NodeType.MODULE,
        name: 'Auth Module'
      });

      const node2 = memorySystem.addKnowledgeNode({
        type: NodeType.MODULE,
        name: 'User Module'
      });

      const edgeId = memorySystem.addKnowledgeEdge({
        from: node1,
        to: node2,
        type: RelationType.DEPENDS_ON
      });

      expect(edgeId).toBeDefined();
      expect(memorySystem.knowledgeGraph.edges.has(edgeId)).toBe(true);
    });

    test('应该查询知识节点', () => {
      memorySystem.addKnowledgeNode({
        type: NodeType.CONCEPT,
        name: 'Concept 1'
      });

      memorySystem.addKnowledgeNode({
        type: NodeType.FILE,
        name: 'File 1'
      });

      const nodes = memorySystem.queryKnowledgeNodes({
        type: NodeType.CONCEPT
      });

      expect(nodes.length).toBe(1);
      expect(nodes[0].type).toBe(NodeType.CONCEPT);
    });

    test('应该获取节点邻居', () => {
      const node1 = memorySystem.addKnowledgeNode({
        type: NodeType.MODULE,
        name: 'Module 1'
      });

      const node2 = memorySystem.addKnowledgeNode({
        type: NodeType.MODULE,
        name: 'Module 2'
      });

      memorySystem.addKnowledgeEdge({
        from: node1,
        to: node2,
        type: RelationType.DEPENDS_ON
      });

      const neighbors = memorySystem.getKnowledgeNeighbors(node1);

      expect(neighbors.length).toBe(1);
      expect(neighbors[0].id).toBe(node2);
    });
  });

  describe('模式提取', () => {
    test('应该在达到阈值时提取模式', () => {
      let patternExtracted = false;
      memorySystem.on('patternExtracted', () => {
        patternExtracted = true;
      });

      // 触发 3 次相同事件
      memorySystem.setPreference('key1', 'value1');
      memorySystem.setPreference('key2', 'value2');
      memorySystem.setPreference('key3', 'value3');

      expect(patternExtracted).toBe(true);
    });

    test('应该获取所有模式', () => {
      // 触发模式提取
      for (let i = 0; i < 3; i++) {
        memorySystem.setPreference(`key${i}`, `value${i}`);
      }

      const patterns = memorySystem.getPatterns();
      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  describe('统计信息', () => {
    test('应该返回统计信息', () => {
      memorySystem.addDecision({
        title: 'Test Decision',
        decision: 'Use TypeScript'
      });

      memorySystem.addKnowledgeNode({
        type: NodeType.CONCEPT,
        name: 'Test Concept'
      });

      const stats = memorySystem.getStats();

      expect(stats.decisions).toBeDefined();
      expect(stats.knowledge).toBeDefined();
    });
  });

  describe('事件', () => {
    test('应该触发 decisionAdded 事件', (done) => {
      memorySystem.on('decisionAdded', () => {
        done();
      });

      memorySystem.addDecision({
        title: 'Test Decision',
        decision: 'Use TypeScript'
      });
    });

    test('应该触发 knowledgeNodeAdded 事件', (done) => {
      memorySystem.on('knowledgeNodeAdded', () => {
        done();
      });

      memorySystem.addKnowledgeNode({
        type: NodeType.CONCEPT,
        name: 'Test Concept'
      });
    });
  });

  describe('createMemorySystem', () => {
    test('应该创建记忆系统实例', () => {
      const system = createMemorySystem();
      expect(system).toBeInstanceOf(MemorySystem);
    });
  });

  describe('destroy', () => {
    test('应该清理资源', async () => {
      await memorySystem.destroy();

      expect(memorySystem.patterns.size).toBe(0);
      expect(memorySystem.eventCounts.size).toBe(0);
    });
  });
});
