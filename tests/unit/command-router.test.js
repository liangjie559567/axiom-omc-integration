/**
 * CommandRouter 单元测试
 */

import {
  CommandRouter,
  CommandPriority,
  CommandSystem,
  ConflictStrategy,
  createCommandRouter
} from '../../src/core/command-router.js';

describe('CommandRouter', () => {
  let router;

  beforeEach(() => {
    router = new CommandRouter();
  });

  describe('构造函数', () => {
    test('应该创建路由器实例', () => {
      expect(router).toBeDefined();
      expect(router.commands).toBeDefined();
      expect(router.aliases).toBeDefined();
      expect(router.history).toBeDefined();
    });

    test('应该使用默认配置', () => {
      expect(router.config.conflictStrategy).toBe(ConflictStrategy.LATEST);
      expect(router.config.maxHistorySize).toBe(100);
      expect(router.config.enableValidation).toBe(true);
    });

    test('应该使用自定义配置', () => {
      const customRouter = new CommandRouter({
        conflictStrategy: ConflictStrategy.OMC_PRIORITY,
        maxHistorySize: 50
      });

      expect(customRouter.config.conflictStrategy).toBe(ConflictStrategy.OMC_PRIORITY);
      expect(customRouter.config.maxHistorySize).toBe(50);
    });
  });

  describe('register', () => {
    test('应该注册命令', () => {
      const handler = () => {};
      const result = router.register('test', handler, {
        system: CommandSystem.OMC,
        description: 'Test command'
      });

      expect(result).toBe(true);
      expect(router.commands.has('test')).toBe(true);
      expect(router.stats.totalCommands).toBe(1);
    });

    test('应该注册命令别名', () => {
      const handler = () => {};
      router.register('test', handler, {
        aliases: ['t', 'tst']
      });

      expect(router.aliases.get('t')).toBe('test');
      expect(router.aliases.get('tst')).toBe('test');
    });

    test('应该在命令名称无效时抛出错误', () => {
      expect(() => {
        router.register('', () => {});
      }).toThrow('命令名称必须是非空字符串');
    });

    test('应该在处理器无效时抛出错误', () => {
      expect(() => {
        router.register('test', null);
      }).toThrow('命令处理器必须是函数');
    });

    test('应该检测命令冲突', () => {
      const handler1 = () => {};
      const handler2 = () => {};

      router.register('test', handler1);
      router.register('test', handler2);

      expect(router.stats.conflictsDetected).toBe(1);
    });
  });

  describe('unregister', () => {
    test('应该注销命令', () => {
      const handler = () => {};
      router.register('test', handler);

      const result = router.unregister('test');

      expect(result).toBe(true);
      expect(router.commands.has('test')).toBe(false);
      expect(router.stats.totalCommands).toBe(0);
    });

    test('应该删除命令别名', () => {
      const handler = () => {};
      router.register('test', handler, {
        aliases: ['t']
      });

      router.unregister('test');

      expect(router.aliases.has('t')).toBe(false);
    });

    test('应该在命令不存在时返回 false', () => {
      const result = router.unregister('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('route', () => {
    test('应该路由命令', async () => {
      const handler = async () => 'result';
      router.register('test', handler);

      const result = await router.route('test', ['arg1', 'arg2']);

      expect(result).toBe('result');
      expect(router.stats.totalExecutions).toBe(1);
      expect(router.stats.successfulExecutions).toBe(1);
    });

    test('应该通过别名路由命令', async () => {
      const handler = async () => 'result';
      router.register('test', handler, {
        aliases: ['t']
      });

      const result = await router.route('t', []);

      expect(result).toBe('result');
    });

    test('应该在命令不存在时抛出错误', async () => {
      await expect(
        router.route('nonexistent')
      ).rejects.toThrow('命令不存在');
    });

    test('应该记录命令历史', async () => {
      const handler = async () => 'result';
      router.register('test', handler);

      await router.route('test', []);

      expect(router.history.length).toBe(1);
      expect(router.history[0].command).toBe('test');
      expect(router.history[0].status).toBe('success');
    });

    test('应该处理命令执行错误', async () => {
      const handler = async () => { throw new Error('Test error'); };
      router.register('test', handler);

      await expect(
        router.route('test', [])
      ).rejects.toThrow('Test error');

      expect(router.stats.failedExecutions).toBe(1);
      expect(router.history[0].status).toBe('failed');
    });

    test('应该验证命令参数', async () => {
      const handler = async () => {};
      const validation = () => ({
        valid: false,
        error: 'Invalid args'
      });

      router.register('test', handler, { validation });

      await expect(
        router.route('test', [])
      ).rejects.toThrow('参数验证失败');
    });

    test('应该检查命令权限', async () => {
      const handler = async () => {};
      router.register('test', handler, {
        permissions: ['admin']
      });

      await expect(
        router.route('test', [], { permissions: [] })
      ).rejects.toThrow('权限不足');
    });
  });

  describe('getCommand', () => {
    test('应该获取命令信息', () => {
      const handler = () => {};
      router.register('test', handler, {
        description: 'Test command'
      });

      const command = router.getCommand('test');

      expect(command).toBeDefined();
      expect(command.name).toBe('test');
      expect(command.description).toBe('Test command');
    });

    test('应该通过别名获取命令', () => {
      const handler = () => {};
      router.register('test', handler, {
        aliases: ['t']
      });

      const command = router.getCommand('t');

      expect(command).toBeDefined();
      expect(command.name).toBe('test');
    });

    test('应该在命令不存在时返回 null', () => {
      const command = router.getCommand('nonexistent');
      expect(command).toBeNull();
    });
  });

  describe('getAllCommands', () => {
    test('应该获取所有命令', () => {
      router.register('test1', () => {});
      router.register('test2', () => {});

      const commands = router.getAllCommands();

      expect(commands.length).toBe(2);
    });

    test('应该按系统过滤命令', () => {
      router.register('test1', () => {}, { system: CommandSystem.OMC });
      router.register('test2', () => {}, { system: CommandSystem.AXIOM });

      const commands = router.getAllCommands({ system: CommandSystem.OMC });

      expect(commands.length).toBe(1);
      expect(commands[0].system).toBe(CommandSystem.OMC);
    });

    test('应该按优先级过滤命令', () => {
      router.register('test1', () => {}, { priority: CommandPriority.LOW });
      router.register('test2', () => {}, { priority: CommandPriority.HIGH });

      const commands = router.getAllCommands({ priority: CommandPriority.NORMAL });

      expect(commands.length).toBe(1);
      expect(commands[0].priority).toBe(CommandPriority.HIGH);
    });

    test('应该按名称排序命令', () => {
      router.register('zebra', () => {});
      router.register('alpha', () => {});

      const commands = router.getAllCommands({ sortBy: 'name' });

      expect(commands[0].name).toBe('alpha');
      expect(commands[1].name).toBe('zebra');
    });
  });

  describe('detectConflict', () => {
    test('应该检测命令冲突', () => {
      router.register('test', () => {});

      expect(router.detectConflict('test')).toBe(true);
      expect(router.detectConflict('nonexistent')).toBe(false);
    });
  });

  describe('getHistory', () => {
    test('应该获取命令历史', async () => {
      router.register('test', async () => 'result');
      await router.route('test', []);

      const history = router.getHistory();

      expect(history.length).toBe(1);
      expect(history[0].command).toBe('test');
    });

    test('应该按命令过滤历史', async () => {
      router.register('test1', async () => 'result');
      router.register('test2', async () => 'result');

      await router.route('test1', []);
      await router.route('test2', []);

      const history = router.getHistory({ command: 'test1' });

      expect(history.length).toBe(1);
      expect(history[0].command).toBe('test1');
    });

    test('应该限制历史数量', async () => {
      router.register('test', async () => 'result');

      await router.route('test', []);
      await router.route('test', []);
      await router.route('test', []);

      const history = router.getHistory({ limit: 2 });

      expect(history.length).toBe(2);
    });
  });

  describe('clearHistory', () => {
    test('应该清空历史', async () => {
      router.register('test', async () => 'result');
      await router.route('test', []);

      router.clearHistory();

      expect(router.history.length).toBe(0);
    });
  });

  describe('getStats', () => {
    test('应该返回统计信息', async () => {
      router.register('test', async () => 'result');
      await router.route('test', []);

      const stats = router.getStats();

      expect(stats.totalCommands).toBe(1);
      expect(stats.totalExecutions).toBe(1);
      expect(stats.successfulExecutions).toBe(1);
      expect(stats.successRate).toBe('100.00%');
    });
  });

  describe('冲突解决策略', () => {
    test('应该使用 LATEST 策略', () => {
      const router = new CommandRouter({
        conflictStrategy: ConflictStrategy.LATEST
      });

      const handler1 = () => {};
      const handler2 = () => {};

      router.register('test', handler1);
      router.register('test', handler2);

      const command = router.getCommand('test');
      expect(command.handler).toBe(handler2);
    });

    test('应该使用 OMC_PRIORITY 策略', () => {
      const router = new CommandRouter({
        conflictStrategy: ConflictStrategy.OMC_PRIORITY
      });

      const handler1 = () => {};
      const handler2 = () => {};

      router.register('test', handler1, { system: CommandSystem.AXIOM });
      router.register('test', handler2, { system: CommandSystem.OMC });

      const command = router.getCommand('test');
      expect(command.handler).toBe(handler2);
    });

    test('应该使用 AXIOM_PRIORITY 策略', () => {
      const router = new CommandRouter({
        conflictStrategy: ConflictStrategy.AXIOM_PRIORITY
      });

      const handler1 = () => {};
      const handler2 = () => {};

      router.register('test', handler1, { system: CommandSystem.OMC });
      router.register('test', handler2, { system: CommandSystem.AXIOM });

      const command = router.getCommand('test');
      expect(command.handler).toBe(handler2);
    });
  });

  describe('事件', () => {
    test('应该触发 commandRegistered 事件', (done) => {
      router.on('commandRegistered', () => {
        done();
      });

      router.register('test', () => {});
    });

    test('应该触发 commandExecuting 事件', async () => {
      let eventFired = false;
      router.on('commandExecuting', () => {
        eventFired = true;
      });

      router.register('test', async () => 'result');
      await router.route('test', []);

      expect(eventFired).toBe(true);
    });

    test('应该触发 commandExecuted 事件', async () => {
      let eventFired = false;
      router.on('commandExecuted', () => {
        eventFired = true;
      });

      router.register('test', async () => 'result');
      await router.route('test', []);

      expect(eventFired).toBe(true);
    });

    test('应该触发 conflictDetected 事件', (done) => {
      router.on('conflictDetected', () => {
        done();
      });

      router.register('test', () => {});
      router.register('test', () => {});
    });
  });

  describe('createCommandRouter', () => {
    test('应该创建路由器实例', () => {
      const router = createCommandRouter();
      expect(router).toBeInstanceOf(CommandRouter);
    });
  });
});
