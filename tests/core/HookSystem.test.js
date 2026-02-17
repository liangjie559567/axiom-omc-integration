/**
 * HookSystem 测试
 */

import { HookSystem, HookContext, HookExecutor } from '../src/core/HookSystem.js';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('HookSystem', () => {
  let hookSystem;

  beforeEach(() => {
    hookSystem = new HookSystem();
  });

  describe('基本功能', () => {
    it('应该能够注册钩子', () => {
      hookSystem.registerHook('TestEvent', {
        hooks: [{
          type: 'function',
          function: () => {},
          async: false
        }]
      });

      const stats = hookSystem.getStats();
      expect(stats.registered).toBe(1);
      expect(stats.events).toBe(1);
    });

    it('应该能够执行函数钩子', async () => {
      let executed = false;

      hookSystem.registerHook('TestEvent', {
        hooks: [{
          type: 'function',
          function: () => { executed = true; },
          async: false
        }]
      });

      await hookSystem.executeHooks('TestEvent');
      expect(executed).toBe(true);
    });

    it('应该能够传递上下文数据', async () => {
      let receivedData = null;

      hookSystem.registerHook('TestEvent', {
        hooks: [{
          type: 'function',
          function: (context) => { receivedData = context.data; },
          async: false
        }]
      });

      await hookSystem.executeHooks('TestEvent', { test: 'value' });
      expect(receivedData).toEqual({ test: 'value' });
    });
  });

  describe('匹配器', () => {
    it('应该支持正则表达式匹配器', async () => {
      let executed = false;

      hookSystem.registerHook('TestEvent', {
        matcher: 'start|begin',
        hooks: [{
          type: 'function',
          function: () => { executed = true; },
          async: false
        }]
      });

      // 匹配成功
      await hookSystem.executeHooks('TestEvent', { action: 'start' });
      expect(executed).toBe(true);

      // 重置
      executed = false;

      // 匹配失败
      await hookSystem.executeHooks('TestEvent', { action: 'end' });
      expect(executed).toBe(false);
    });
  });

  describe('异步执行', () => {
    it('应该支持异步钩子', async () => {
      let executed = false;

      hookSystem.registerHook('TestEvent', {
        hooks: [{
          type: 'function',
          function: async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            executed = true;
          },
          async: false
        }]
      });

      await hookSystem.executeHooks('TestEvent');
      expect(executed).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应该捕获钩子执行错误', async () => {
      hookSystem.registerHook('TestEvent', {
        hooks: [{
          type: 'function',
          function: () => { throw new Error('Test error'); },
          async: false
        }]
      });

      const result = await hookSystem.executeHooks('TestEvent');
      expect(result.executed).toBe(0);
      expect(result.results[0].success).toBe(false);
    });

    it('错误不应该影响其他钩子执行', async () => {
      let secondExecuted = false;

      hookSystem.registerHook('TestEvent', {
        hooks: [
          {
            type: 'function',
            function: () => { throw new Error('Test error'); },
            async: false
          },
          {
            type: 'function',
            function: () => { secondExecuted = true; },
            async: false
          }
        ]
      });

      await hookSystem.executeHooks('TestEvent');
      expect(secondExecuted).toBe(true);
    });
  });

  describe('统计信息', () => {
    it('应该正确统计执行次数', async () => {
      hookSystem.registerHook('TestEvent', {
        hooks: [{
          type: 'function',
          function: () => {},
          async: false
        }]
      });

      await hookSystem.executeHooks('TestEvent');
      await hookSystem.executeHooks('TestEvent');

      const stats = hookSystem.getStats();
      expect(stats.executed).toBe(2);
    });

    it('应该正确统计失败次数', async () => {
      hookSystem.registerHook('TestEvent', {
        hooks: [{
          type: 'function',
          function: () => { throw new Error('Test error'); },
          async: false
        }]
      });

      await hookSystem.executeHooks('TestEvent');

      const stats = hookSystem.getStats();
      expect(stats.failed).toBe(1);
    });
  });

  describe('清理操作', () => {
    it('应该能够清除所有钩子', () => {
      hookSystem.registerHook('TestEvent', {
        hooks: [{
          type: 'function',
          function: () => {},
          async: false
        }]
      });

      hookSystem.clear();

      const stats = hookSystem.getStats();
      expect(stats.events).toBe(0);
      expect(stats.hooks).toBe(0);
    });

    it('应该能够移除特定事件的钩子', () => {
      hookSystem.registerHook('TestEvent1', {
        hooks: [{ type: 'function', function: () => {} }]
      });
      hookSystem.registerHook('TestEvent2', {
        hooks: [{ type: 'function', function: () => {} }]
      });

      hookSystem.removeHooks('TestEvent1');

      const stats = hookSystem.getStats();
      expect(stats.events).toBe(1);
    });
  });
});

describe('HookExecutor', () => {
  describe('变量展开', () => {
    it('应该展开环境变量', () => {
      process.env.TEST_VAR = 'test_value';

      const context = new HookContext('test', {});
      const expanded = HookExecutor.expandVariables('${TEST_VAR}', context);

      expect(expanded).toBe('test_value');

      delete process.env.TEST_VAR;
    });

    it('应该展开上下文变量', () => {
      const context = new HookContext('test', { WORKFLOW_NAME: 'TestWorkflow' });
      const expanded = HookExecutor.expandVariables('${WORKFLOW_NAME}', context);

      expect(expanded).toBe('TestWorkflow');
    });

    it('上下文变量应该优先于环境变量', () => {
      process.env.VAR = 'env_value';

      const context = new HookContext('test', { VAR: 'context_value' });
      const expanded = HookExecutor.expandVariables('${VAR}', context);

      expect(expanded).toBe('context_value');

      delete process.env.VAR;
    });
  });
});

describe('HookContext', () => {
  it('应该创建有效的上下文', () => {
    const context = new HookContext('TestEvent', { key: 'value' });

    expect(context.event).toBe('TestEvent');
    expect(context.data).toEqual({ key: 'value' });
    expect(context.timestamp).toBeDefined();
  });
});
