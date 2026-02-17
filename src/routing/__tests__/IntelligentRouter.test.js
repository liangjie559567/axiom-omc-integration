/**
 * 智能路由引擎测试
 */

import { jest } from '@jest/globals';
import IntelligentRouter, { RoutingStrategy, NodeStatus } from '../IntelligentRouter.js';

describe('IntelligentRouter', () => {
  let router;

  beforeEach(() => {
    router = new IntelligentRouter({
      defaultStrategy: RoutingStrategy.LEAST_LOAD,
      healthCheckInterval: 1000,
      maxRetries: 3,
      retryDelay: 100,
      timeout: 5000
    });
  });

  afterEach(() => {
    router.destroy();
  });

  describe('初始化', () => {
    test('应该正确初始化', () => {
      expect(router).toBeDefined();
      expect(router.nodes.size).toBe(0);
      expect(router.strategies.size).toBeGreaterThan(0);
    });

    test('应该初始化内置策略', () => {
      expect(router.strategies.has(RoutingStrategy.ROUND_ROBIN)).toBe(true);
      expect(router.strategies.has(RoutingStrategy.LEAST_LOAD)).toBe(true);
      expect(router.strategies.has(RoutingStrategy.WEIGHTED)).toBe(true);
      expect(router.strategies.has(RoutingStrategy.RANDOM)).toBe(true);
      expect(router.strategies.has(RoutingStrategy.CONTEXT_AWARE)).toBe(true);
    });
  });

  describe('节点管理', () => {
    test('应该注册节点', () => {
      const node = router.registerNode('node-1', {
        name: 'Node 1',
        endpoint: 'http://localhost:3000',
        group: 'default'
      });

      expect(node).toBeDefined();
      expect(node.id).toBe('node-1');
      expect(router.nodes.has('node-1')).toBe(true);
    });

    test('应该触发节点注册事件', (done) => {
      router.once('node_registered', (event) => {
        expect(event.nodeId).toBe('node-1');
        done();
      });

      router.registerNode('node-1', {
        name: 'Node 1',
        endpoint: 'http://localhost:3000'
      });
    });

    test('应该注销节点', () => {
      router.registerNode('node-1', {
        name: 'Node 1',
        endpoint: 'http://localhost:3000'
      });

      router.unregisterNode('node-1');

      expect(router.nodes.has('node-1')).toBe(false);
    });

    test('应该更新节点状态', () => {
      router.registerNode('node-1', {
        name: 'Node 1',
        endpoint: 'http://localhost:3000'
      });

      router.updateNodeStatus('node-1', NodeStatus.DEGRADED);

      const node = router.nodes.get('node-1');
      expect(node.status).toBe(NodeStatus.DEGRADED);
    });
  });

  describe('轮询路由', () => {
    beforeEach(() => {
      router.registerNode('node-1', {
        name: 'Node 1',
        endpoint: 'http://localhost:3001',
        group: 'test'
      });

      router.registerNode('node-2', {
        name: 'Node 2',
        endpoint: 'http://localhost:3002',
        group: 'test'
      });

      router.registerNode('node-3', {
        name: 'Node 3',
        endpoint: 'http://localhost:3003',
        group: 'test'
      });
    });

    test('应该轮询选择节点', () => {
      const node1 = router.route('test', {}, RoutingStrategy.ROUND_ROBIN);
      const node2 = router.route('test', {}, RoutingStrategy.ROUND_ROBIN);
      const node3 = router.route('test', {}, RoutingStrategy.ROUND_ROBIN);
      const node4 = router.route('test', {}, RoutingStrategy.ROUND_ROBIN);

      expect(node1.id).toBe('node-1');
      expect(node2.id).toBe('node-2');
      expect(node3.id).toBe('node-3');
      expect(node4.id).toBe('node-1'); // 循环回到第一个
    });
  });

  describe('最小负载路由', () => {
    beforeEach(() => {
      router.registerNode('node-1', {
        name: 'Node 1',
        endpoint: 'http://localhost:3001',
        group: 'test'
      });

      router.registerNode('node-2', {
        name: 'Node 2',
        endpoint: 'http://localhost:3002',
        group: 'test'
      });
    });

    test('应该选择负载最小的节点', () => {
      // 模拟 node-1 有负载
      router.loadStats.get('node-1').currentLoad = 5;
      router.loadStats.get('node-2').currentLoad = 2;

      const node = router.route('test', {}, RoutingStrategy.LEAST_LOAD);

      expect(node.id).toBe('node-2');
    });
  });

  describe('加权路由', () => {
    beforeEach(() => {
      router.registerNode('node-1', {
        name: 'Node 1',
        endpoint: 'http://localhost:3001',
        group: 'test',
        weight: 1
      });

      router.registerNode('node-2', {
        name: 'Node 2',
        endpoint: 'http://localhost:3002',
        group: 'test',
        weight: 3
      });
    });

    test('应该根据权重选择节点', () => {
      const selections = { 'node-1': 0, 'node-2': 0 };

      // 多次路由统计分布
      for (let i = 0; i < 100; i++) {
        const node = router.route('test', {}, RoutingStrategy.WEIGHTED);
        selections[node.id]++;
      }

      // node-2 的权重是 node-1 的3倍，应该被选中更多次
      expect(selections['node-2']).toBeGreaterThan(selections['node-1']);
    });
  });

  describe('随机路由', () => {
    beforeEach(() => {
      router.registerNode('node-1', {
        name: 'Node 1',
        endpoint: 'http://localhost:3001',
        group: 'test'
      });

      router.registerNode('node-2', {
        name: 'Node 2',
        endpoint: 'http://localhost:3002',
        group: 'test'
      });
    });

    test('应该随机选择节点', () => {
      const selections = new Set();

      for (let i = 0; i < 10; i++) {
        const node = router.route('test', {}, RoutingStrategy.RANDOM);
        selections.add(node.id);
      }

      // 应该至少选中过一个节点
      expect(selections.size).toBeGreaterThan(0);
    });
  });

  describe('上下文感知路由', () => {
    beforeEach(() => {
      router.registerNode('node-1', {
        name: 'Node 1',
        endpoint: 'http://localhost:3001',
        group: 'test',
        tags: ['cpu-intensive']
      });

      router.registerNode('node-2', {
        name: 'Node 2',
        endpoint: 'http://localhost:3002',
        group: 'test',
        tags: ['memory-intensive']
      });
    });

    test('应该根据标签选择节点', () => {
      const node = router.route('test', {
        tags: ['cpu-intensive']
      }, RoutingStrategy.CONTEXT_AWARE);

      expect(node.id).toBe('node-1');
    });

    test('应该根据首选节点选择', () => {
      const node = router.route('test', {
        preferredNode: 'node-2'
      }, RoutingStrategy.CONTEXT_AWARE);

      expect(node.id).toBe('node-2');
    });
  });

  describe('请求执行', () => {
    beforeEach(() => {
      router.registerNode('node-1', {
        name: 'Node 1',
        endpoint: 'http://localhost:3001',
        group: 'test'
      });
    });

    test('应该执行成功的请求', async () => {
      const handler = jest.fn().mockResolvedValue('success');

      const result = await router.execute('test', handler);

      expect(result).toBe('success');
      expect(handler).toHaveBeenCalled();
    });

    test('应该记录请求统计', async () => {
      const handler = jest.fn().mockResolvedValue('success');

      await router.execute('test', handler);

      const stats = router.getNodeStats('node-1');
      expect(stats.totalRequests).toBe(1);
      expect(stats.successfulRequests).toBe(1);
    });

    test('应该在失败时重试', async () => {
      const handler = jest.fn()
        .mockRejectedValueOnce(new Error('Failed'))
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce('success');

      const result = await router.execute('test', handler);

      expect(result).toBe('success');
      expect(handler).toHaveBeenCalledTimes(3);
    });

    test('应该在所有重试失败后抛出错误', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Failed'));

      await expect(router.execute('test', handler))
        .rejects.toThrow('Failed');

      expect(handler).toHaveBeenCalledTimes(3); // maxRetries = 3
    });
  });

  describe('自定义策略', () => {
    test('应该注册自定义策略', () => {
      const customStrategy = jest.fn((nodes) => nodes[0]);

      router.registerStrategy('custom', customStrategy);

      expect(router.strategies.has('custom')).toBe(true);
    });

    test('应该使用自定义策略', () => {
      router.registerNode('node-1', {
        name: 'Node 1',
        endpoint: 'http://localhost:3001',
        group: 'test'
      });

      const customStrategy = jest.fn((nodes) => nodes[0]);
      router.registerStrategy('custom', customStrategy);

      const node = router.route('test', {}, 'custom');

      expect(customStrategy).toHaveBeenCalled();
      expect(node.id).toBe('node-1');
    });
  });

  describe('节点统计', () => {
    beforeEach(() => {
      router.registerNode('node-1', {
        name: 'Node 1',
        endpoint: 'http://localhost:3001',
        group: 'test',
        capacity: 100
      });
    });

    test('应该获取节点统计', () => {
      const stats = router.getNodeStats('node-1');

      expect(stats).toBeDefined();
      expect(stats.id).toBe('node-1');
      expect(stats.totalRequests).toBe(0);
      expect(stats.currentLoad).toBe(0);
    });

    test('应该返回null对于不存在的节点', () => {
      const stats = router.getNodeStats('non-existent');
      expect(stats).toBeNull();
    });
  });

  describe('节点列表', () => {
    test('应该获取所有节点', () => {
      router.registerNode('node-1', {
        name: 'Node 1',
        endpoint: 'http://localhost:3001',
        group: 'group1'
      });

      router.registerNode('node-2', {
        name: 'Node 2',
        endpoint: 'http://localhost:3002',
        group: 'group2'
      });

      const nodes = router.getAllNodes();

      expect(nodes).toHaveLength(2);
    });

    test('应该按组过滤节点', () => {
      router.registerNode('node-1', {
        name: 'Node 1',
        endpoint: 'http://localhost:3001',
        group: 'group1'
      });

      router.registerNode('node-2', {
        name: 'Node 2',
        endpoint: 'http://localhost:3002',
        group: 'group2'
      });

      const nodes = router.getAllNodes('group1');

      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe('node-1');
    });
  });

  describe('统计信息', () => {
    test('应该生成统计信息', async () => {
      router.registerNode('node-1', {
        name: 'Node 1',
        endpoint: 'http://localhost:3001',
        group: 'test'
      });

      router.registerNode('node-2', {
        name: 'Node 2',
        endpoint: 'http://localhost:3002',
        group: 'test'
      });

      const handler = jest.fn().mockResolvedValue('success');
      await router.execute('test', handler);

      const stats = router.getStatistics();

      expect(stats.total).toBe(2);
      expect(stats.totalRequests).toBeGreaterThan(0);
      expect(stats.byGroup.test).toBe(2);
    });
  });

  describe('错误处理', () => {
    test('应该在没有健康节点时抛出错误', () => {
      expect(() => {
        router.route('non-existent');
      }).toThrow('没有可用的健康节点');
    });

    test('应该在未知策略时抛出错误', () => {
      router.registerNode('node-1', {
        name: 'Node 1',
        endpoint: 'http://localhost:3001',
        group: 'test'
      });

      expect(() => {
        router.route('test', {}, 'unknown-strategy');
      }).toThrow('未知的路由策略');
    });
  });

  describe('事件', () => {
    test('应该触发路由事件', () => {
      const events = [];

      router.on('node_registered', () => events.push('registered'));
      router.on('route', () => events.push('route'));

      router.registerNode('node-1', {
        name: 'Node 1',
        endpoint: 'http://localhost:3001',
        group: 'test'
      });

      router.route('test');

      expect(events).toContain('registered');
      expect(events).toContain('route');
    });
  });

  describe('销毁', () => {
    test('应该正确销毁', () => {
      router.registerNode('node-1', {
        name: 'Node 1',
        endpoint: 'http://localhost:3001'
      });

      router.destroy();

      expect(router.nodes.size).toBe(0);
      expect(router.loadStats.size).toBe(0);
    });
  });
});
