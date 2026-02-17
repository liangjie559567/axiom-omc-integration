/**
 * 智能决策引擎测试
 */

import { jest } from '@jest/globals';
import DecisionEngine, { DecisionType, ConfidenceLevel } from '../DecisionEngine.js';

describe('DecisionEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new DecisionEngine({
      enableLearning: true,
      confidenceThreshold: 0.5,
      maxHistorySize: 100
    });
  });

  afterEach(() => {
    engine.destroy();
  });

  describe('初始化', () => {
    test('应该正确初始化', () => {
      expect(engine).toBeDefined();
      expect(engine.options.enableLearning).toBe(true);
      expect(engine.decisionHistory).toEqual([]);
    });

    test('应该设置知识图谱', () => {
      const mockGraph = { query: jest.fn() };
      engine.setKnowledgeGraph(mockGraph);
      expect(engine.knowledgeGraph).toBe(mockGraph);
    });
  });

  describe('规则注册', () => {
    test('应该注册决策规则', () => {
      const rule = jest.fn();
      engine.registerRule(DecisionType.AGENT_SELECTION, rule, 10);

      expect(engine.rules.has(DecisionType.AGENT_SELECTION)).toBe(true);
      expect(engine.rules.get(DecisionType.AGENT_SELECTION)).toHaveLength(1);
    });

    test('应该按优先级排序规则', () => {
      const rule1 = jest.fn();
      const rule2 = jest.fn();
      const rule3 = jest.fn();

      engine.registerRule(DecisionType.AGENT_SELECTION, rule1, 5);
      engine.registerRule(DecisionType.AGENT_SELECTION, rule2, 10);
      engine.registerRule(DecisionType.AGENT_SELECTION, rule3, 1);

      const rules = engine.rules.get(DecisionType.AGENT_SELECTION);
      expect(rules[0].priority).toBe(10);
      expect(rules[1].priority).toBe(5);
      expect(rules[2].priority).toBe(1);
    });
  });

  describe('决策制定', () => {
    test('应该基于规则做出决策', async () => {
      const rule = jest.fn().mockResolvedValue({
        choice: 'agent-1',
        confidence: 0.9
      });

      engine.registerRule(DecisionType.AGENT_SELECTION, rule, 10);

      const decision = await engine.makeDecision(DecisionType.AGENT_SELECTION, {
        task: 'test-task'
      });

      expect(decision).toBeDefined();
      expect(decision.type).toBe(DecisionType.AGENT_SELECTION);
      expect(decision.choice).toBe('agent-1');
      expect(decision.confidence).toBeGreaterThan(0);
      expect(decision.confidenceLevel).toBeDefined();
    });

    test('应该记录决策历史', async () => {
      const rule = jest.fn().mockResolvedValue({
        choice: 'agent-1',
        confidence: 0.8
      });

      engine.registerRule(DecisionType.AGENT_SELECTION, rule, 10);

      await engine.makeDecision(DecisionType.AGENT_SELECTION, { task: 'test' });

      expect(engine.decisionHistory).toHaveLength(1);
      expect(engine.decisionHistory[0].type).toBe(DecisionType.AGENT_SELECTION);
    });

    test('应该触发决策事件', async () => {
      const rule = jest.fn().mockResolvedValue({
        choice: 'agent-1',
        confidence: 0.8
      });

      engine.registerRule(DecisionType.AGENT_SELECTION, rule, 10);

      const eventPromise = new Promise(resolve => {
        engine.once('decision', resolve);
      });

      await engine.makeDecision(DecisionType.AGENT_SELECTION, { task: 'test' });

      const event = await eventPromise;
      expect(event.type).toBe(DecisionType.AGENT_SELECTION);
    });

    test('应该正确计算置信度级别', async () => {
      // 创建禁用学习的引擎以避免学习加成影响置信度
      const testEngine = new DecisionEngine({ enableLearning: false });

      const highConfRule = jest.fn().mockResolvedValue({
        choice: 'high',
        confidence: 0.9
      });

      const mediumConfRule = jest.fn().mockResolvedValue({
        choice: 'medium',
        confidence: 0.65
      });

      const lowConfRule = jest.fn().mockResolvedValue({
        choice: 'low',
        confidence: 0.3
      });

      testEngine.registerRule('high', highConfRule, 1);
      testEngine.registerRule('medium', mediumConfRule, 1);
      testEngine.registerRule('low', lowConfRule, 1);

      const highDecision = await testEngine.makeDecision('high', {});
      expect(highDecision.confidenceLevel).toBe(ConfidenceLevel.HIGH);

      const mediumDecision = await testEngine.makeDecision('medium', {});
      expect(mediumDecision.confidenceLevel).toBe(ConfidenceLevel.MEDIUM);

      const lowDecision = await testEngine.makeDecision('low', {});
      expect(lowDecision.confidenceLevel).toBe(ConfidenceLevel.LOW);

      testEngine.destroy();
    });
  });

  describe('决策反馈', () => {
    test('应该记录成功反馈', async () => {
      const rule = jest.fn().mockResolvedValue({
        choice: 'agent-1',
        confidence: 0.8
      });

      engine.registerRule(DecisionType.AGENT_SELECTION, rule, 10);

      const decision = await engine.makeDecision(DecisionType.AGENT_SELECTION, { task: 'test' });

      engine.provideFeedback(decision.id, true, { reason: 'worked well' });

      const recorded = engine.decisionHistory.find(d => d.id === decision.id);
      expect(recorded.feedback).toBeDefined();
      expect(recorded.feedback.success).toBe(true);
    });

    test('应该记录失败反馈', async () => {
      const rule = jest.fn().mockResolvedValue({
        choice: 'agent-1',
        confidence: 0.8
      });

      engine.registerRule(DecisionType.AGENT_SELECTION, rule, 10);

      const decision = await engine.makeDecision(DecisionType.AGENT_SELECTION, { task: 'test' });

      engine.provideFeedback(decision.id, false, { reason: 'failed' });

      const recorded = engine.decisionHistory.find(d => d.id === decision.id);
      expect(recorded.feedback).toBeDefined();
      expect(recorded.feedback.success).toBe(false);
    });

    test('应该触发反馈事件', async () => {
      const rule = jest.fn().mockResolvedValue({
        choice: 'agent-1',
        confidence: 0.8
      });

      engine.registerRule(DecisionType.AGENT_SELECTION, rule, 10);

      const decision = await engine.makeDecision(DecisionType.AGENT_SELECTION, { task: 'test' });

      const eventPromise = new Promise(resolve => {
        engine.once('feedback', resolve);
      });

      engine.provideFeedback(decision.id, true);

      const event = await eventPromise;
      expect(event.decisionId).toBe(decision.id);
      expect(event.success).toBe(true);
    });
  });

  describe('学习机制', () => {
    test('应该从成功决策中学习', async () => {
      const rule = jest.fn().mockResolvedValue({
        choice: 'agent-1',
        confidence: 0.8
      });

      engine.registerRule(DecisionType.AGENT_SELECTION, rule, 10);

      const decision = await engine.makeDecision(DecisionType.AGENT_SELECTION, {
        agentType: 'executor',
        task: 'test'
      });

      engine.provideFeedback(decision.id, true);

      expect(engine.learningModel.successPatterns.has(DecisionType.AGENT_SELECTION)).toBe(true);
      expect(engine.learningModel.successPatterns.get(DecisionType.AGENT_SELECTION).length).toBe(1);
    });

    test('应该从失败决策中学习', async () => {
      const rule = jest.fn().mockResolvedValue({
        choice: 'agent-1',
        confidence: 0.8
      });

      engine.registerRule(DecisionType.AGENT_SELECTION, rule, 10);

      const decision = await engine.makeDecision(DecisionType.AGENT_SELECTION, {
        agentType: 'executor',
        task: 'test'
      });

      engine.provideFeedback(decision.id, false);

      expect(engine.learningModel.failurePatterns.has(DecisionType.AGENT_SELECTION)).toBe(true);
      expect(engine.learningModel.failurePatterns.get(DecisionType.AGENT_SELECTION).length).toBe(1);
    });
  });

  describe('历史查询', () => {
    test('应该获取所有历史', async () => {
      const rule = jest.fn().mockResolvedValue({
        choice: 'agent-1',
        confidence: 0.8
      });

      engine.registerRule(DecisionType.AGENT_SELECTION, rule, 10);

      await engine.makeDecision(DecisionType.AGENT_SELECTION, { task: 'test1' });
      await engine.makeDecision(DecisionType.AGENT_SELECTION, { task: 'test2' });

      const history = engine.getHistory();
      expect(history).toHaveLength(2);
    });

    test('应该按类型过滤历史', async () => {
      const rule1 = jest.fn().mockResolvedValue({ choice: 'a', confidence: 0.8 });
      const rule2 = jest.fn().mockResolvedValue({ choice: 'b', confidence: 0.8 });

      engine.registerRule(DecisionType.AGENT_SELECTION, rule1, 10);
      engine.registerRule(DecisionType.WORKFLOW_ROUTING, rule2, 10);

      await engine.makeDecision(DecisionType.AGENT_SELECTION, { task: 'test1' });
      await engine.makeDecision(DecisionType.WORKFLOW_ROUTING, { task: 'test2' });

      const history = engine.getHistory({ type: DecisionType.AGENT_SELECTION });
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe(DecisionType.AGENT_SELECTION);
    });

    test('应该按置信度级别过滤历史', async () => {
      const highRule = jest.fn().mockResolvedValue({ choice: 'a', confidence: 0.9 });
      const lowRule = jest.fn().mockResolvedValue({ choice: 'b', confidence: 0.3 });

      engine.registerRule('high', highRule, 10);
      engine.registerRule('low', lowRule, 10);

      await engine.makeDecision('high', { task: 'test1' });
      await engine.makeDecision('low', { task: 'test2' });

      const history = engine.getHistory({ confidenceLevel: ConfidenceLevel.HIGH });
      expect(history).toHaveLength(1);
      expect(history[0].confidenceLevel).toBe(ConfidenceLevel.HIGH);
    });
  });

  describe('统计信息', () => {
    test('应该生成决策统计', async () => {
      const rule = jest.fn().mockResolvedValue({
        choice: 'agent-1',
        confidence: 0.8
      });

      engine.registerRule(DecisionType.AGENT_SELECTION, rule, 10);

      await engine.makeDecision(DecisionType.AGENT_SELECTION, { task: 'test1' });
      await engine.makeDecision(DecisionType.AGENT_SELECTION, { task: 'test2' });

      const stats = engine.getStatistics();
      expect(stats.total).toBe(2);
      expect(stats.byType[DecisionType.AGENT_SELECTION]).toBe(2);
    });

    test('应该计算成功率', async () => {
      const rule = jest.fn().mockResolvedValue({
        choice: 'agent-1',
        confidence: 0.8
      });

      engine.registerRule(DecisionType.AGENT_SELECTION, rule, 10);

      const d1 = await engine.makeDecision(DecisionType.AGENT_SELECTION, { task: 'test1' });
      const d2 = await engine.makeDecision(DecisionType.AGENT_SELECTION, { task: 'test2' });

      engine.provideFeedback(d1.id, true);
      engine.provideFeedback(d2.id, false);

      const stats = engine.getStatistics();
      expect(stats.withFeedback).toBe(2);
      expect(stats.successful).toBe(1);
      expect(stats.successRate).toBe(0.5);
    });
  });

  describe('历史管理', () => {
    test('应该限制历史大小', async () => {
      const smallEngine = new DecisionEngine({ maxHistorySize: 5 });

      const rule = jest.fn().mockResolvedValue({
        choice: 'agent-1',
        confidence: 0.8
      });

      smallEngine.registerRule(DecisionType.AGENT_SELECTION, rule, 10);

      for (let i = 0; i < 10; i++) {
        await smallEngine.makeDecision(DecisionType.AGENT_SELECTION, { task: `test${i}` });
      }

      expect(smallEngine.decisionHistory).toHaveLength(5);

      smallEngine.destroy();
    });

    test('应该清空历史', async () => {
      const rule = jest.fn().mockResolvedValue({
        choice: 'agent-1',
        confidence: 0.8
      });

      engine.registerRule(DecisionType.AGENT_SELECTION, rule, 10);

      await engine.makeDecision(DecisionType.AGENT_SELECTION, { task: 'test' });

      expect(engine.decisionHistory).toHaveLength(1);

      engine.clearHistory();

      expect(engine.decisionHistory).toHaveLength(0);
    });
  });

  describe('销毁', () => {
    test('应该正确销毁', () => {
      const rule = jest.fn();
      engine.registerRule(DecisionType.AGENT_SELECTION, rule, 10);

      engine.destroy();

      expect(engine.decisionHistory).toHaveLength(0);
      expect(engine.rules.size).toBe(0);
    });
  });
});
