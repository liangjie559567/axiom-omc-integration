/**
 * 工作流集成端到端测试
 *
 * 测试完整的工作流同步场景
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { WorkflowIntegration } from '../../src/core/workflow-integration.js';
import { PhaseMapper } from '../../src/core/phase-mapper.js';
import { AutoSyncEngine } from '../../src/core/auto-sync-engine.js';

describe('工作流集成端到端测试', () => {
  let workflowIntegration;
  let phaseMapper;
  let syncEngine;

  beforeEach(() => {
    workflowIntegration = new WorkflowIntegration();
    phaseMapper = new PhaseMapper();
    syncEngine = new AutoSyncEngine(workflowIntegration, phaseMapper);
  });

  afterEach(() => {
    syncEngine.destroy();
  });

  describe('场景 1: 基础工作流同步', () => {
    test('应该完成完整的工作流同步流程', async () => {
      // 1. 配置映射规则（使用正确的 OMC 阶段名称）
      phaseMapper.registerRule({
        from: 'review',
        to: ['design']  // OMC 的设计阶段
      });

      // 2. 创建工作流实例
      const axiomId = workflowIntegration.startWorkflow('axiom-default', {
        projectName: 'Test Project'
      });

      const omcId = workflowIntegration.startWorkflow('omc-default', {
        projectName: 'Test Project'
      });

      expect(axiomId).toBeDefined();
      expect(omcId).toBeDefined();

      // 3. 建立同步关系
      await syncEngine.linkWorkflows(axiomId, omcId);

      const links = syncEngine.getLinkedWorkflows(axiomId);
      expect(links).toHaveLength(1);
      expect(links[0]).toBe(omcId);

      // 4. 执行阶段转换
      await workflowIntegration.transitionTo(axiomId, 'review');

      // 5. 手动触发同步（更可靠）
      const syncResult = await syncEngine.sync(axiomId, omcId);
      expect(syncResult).toBe(true);

      // 6. 验证同步结果
      const axiomInstance = workflowIntegration.getWorkflowInstance(axiomId);
      const omcInstance = workflowIntegration.getWorkflowInstance(omcId);

      expect(axiomInstance.currentPhase).toBe('review');
      expect(omcInstance.currentPhase).toBe('design');

      // 7. 验证同步历史
      const history = syncEngine.getSyncHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].success).toBe(true);

      // 8. 验证统计信息
      const stats = syncEngine.getStats();
      expect(stats.totalSyncs).toBe(1);
      expect(stats.successfulSyncs).toBe(1);
      expect(stats.failedSyncs).toBe(0);
    });
  });

  describe('场景 2: 手动同步', () => {
    test('应该支持手动同步工作流', async () => {
      // 配置映射规则（使用正确的 OMC 阶段名称）
      phaseMapper.registerRule({
        from: 'review',
        to: ['design']  // OMC 的设计阶段
      });

      // 创建工作流
      const axiomId = workflowIntegration.startWorkflow('axiom-default', {
        projectName: 'Manual Sync Test'
      });

      const omcId = workflowIntegration.startWorkflow('omc-default', {
        projectName: 'Manual Sync Test'
      });

      // 建立链接
      await syncEngine.linkWorkflows(axiomId, omcId);

      // 转换阶段
      await workflowIntegration.transitionTo(axiomId, 'review');

      // 手动同步
      await syncEngine.sync(axiomId, omcId);

      // 验证同步结果
      const omcInstance = workflowIntegration.getWorkflowInstance(omcId);
      expect(omcInstance.currentPhase).toBe('design');

      // 验证统计
      const stats = syncEngine.getStats();
      expect(stats.successfulSyncs).toBe(1);
    });
  });

  describe('场景 3: 完整项目生命周期', () => {
    test('应该支持完整的项目生命周期管理', async () => {
      // 配置完整的映射规则（使用正确的 OMC 阶段名称）
      const phases = [
        { from: 'draft', to: ['planning'] },      // 草稿 -> 规划
        { from: 'review', to: ['design'] },       // 审查 -> 设计
        { from: 'implement', to: ['implementation'] }  // 实现 -> 实现
      ];

      phases.forEach(phase => {
        phaseMapper.registerRule(phase);
      });

      // 创建项目工作流
      const axiomId = workflowIntegration.startWorkflow('axiom-default', {
        projectName: 'Full Lifecycle Project'
      });

      const omcId = workflowIntegration.startWorkflow('omc-default', {
        projectName: 'Full Lifecycle Project'
      });

      await syncEngine.linkWorkflows(axiomId, omcId);

      // 模拟完整的项目生命周期（手动同步）
      const transitions = [
        { axiom: 'draft', omc: 'planning' },
        { axiom: 'review', omc: 'design' },
        { axiom: 'implement', omc: 'implementation' }
      ];

      let syncCount = 0;
      for (const transition of transitions) {
        await workflowIntegration.transitionTo(axiomId, transition.axiom);
        const syncResult = await syncEngine.sync(axiomId, omcId);
        expect(syncResult).toBe(true);
        syncCount++;

        const omcInstance = workflowIntegration.getWorkflowInstance(omcId);
        expect(omcInstance.currentPhase).toBe(transition.omc);
      }

      // 验证统计信息
      const stats = syncEngine.getStats();
      expect(stats.totalSyncs).toBe(syncCount);
      expect(stats.successfulSyncs).toBe(syncCount);
      expect(stats.failedSyncs).toBe(0);
    });
  });

  describe('场景 4: 映射规则测试', () => {
    test('应该正确应用映射规则', () => {
      // 注册多个映射规则
      phaseMapper.registerRule({
        from: 'draft',
        to: ['planning']
      });

      phaseMapper.registerRule({
        from: 'review',
        to: ['in-progress']
      });

      phaseMapper.registerRule({
        from: 'implement',
        to: ['code-review', 'testing']
      });

      // 测试映射
      const result1 = phaseMapper.map('draft');
      expect(result1).toEqual(['planning']);

      const result2 = phaseMapper.map('review');
      expect(result2).toEqual(['in-progress']);

      const result3 = phaseMapper.map('implement');
      expect(result3).toEqual(['code-review', 'testing']);

      // 测试反向映射
      const reverse1 = phaseMapper.reverseMap('planning');
      expect(reverse1).toContain('draft');

      const reverse2 = phaseMapper.reverseMap('in-progress');
      expect(reverse2).toContain('review');
    });
  });

  describe('场景 5: 同步链接管理', () => {
    test('应该正确管理同步链接', async () => {
      // 创建多个工作流
      const axiom1 = workflowIntegration.startWorkflow('axiom-default', {
        projectName: 'Project 1'
      });

      const omc1 = workflowIntegration.startWorkflow('omc-default', {
        projectName: 'Project 1'
      });

      const omc2 = workflowIntegration.startWorkflow('omc-default', {
        projectName: 'Project 2'
      });

      // 建立一对多链接
      await syncEngine.linkWorkflows(axiom1, omc1);
      await syncEngine.linkWorkflows(axiom1, omc2);

      // 验证链接
      const links = syncEngine.getLinkedWorkflows(axiom1);
      expect(links).toHaveLength(2);

      // 验证链接包含正确的目标 ID
      expect(links).toContain(omc1);
      expect(links).toContain(omc2);

      // 验证统计
      const stats = syncEngine.getStats();
      expect(stats.totalLinks).toBe(1); // 1 个源工作流
    });
  });

  describe('场景 6: 性能验证', () => {
    test('映射查找应该很快', () => {
      // 注册大量规则
      for (let i = 0; i < 100; i++) {
        phaseMapper.registerRule({
          from: `phase-${i}`,
          to: [`target-${i}`]
        });
      }

      // 测量查找性能
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        phaseMapper.map(`phase-${i % 100}`);
      }

      const duration = performance.now() - startTime;

      // 应该在 100ms 内完成
      expect(duration).toBeLessThan(100);
    });
  });
});
