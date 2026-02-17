/**
 * PhaseMapper 单元测试
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { PhaseMapper } from '../../src/core/phase-mapper.js';

describe('PhaseMapper', () => {
  let mapper;

  beforeEach(() => {
    mapper = new PhaseMapper();
  });

  describe('构造函数', () => {
    test('应该正确初始化', () => {
      expect(mapper).toBeDefined();
      expect(mapper.mappingRules).toBeDefined();
      expect(mapper.customMappers).toBeDefined();
      expect(mapper.stats).toBeDefined();
    });

    test('应该初始化统计信息', () => {
      const stats = mapper.getStats();
      expect(stats.totalRules).toBe(0);
      expect(stats.totalMappings).toBe(0);
      expect(stats.cacheHits).toBe(0);
    });
  });

  describe('registerRule', () => {
    test('应该成功注册简单映射规则', () => {
      const rule = {
        from: 'axiom:draft',
        to: ['omc:planning'],
        weight: 1.0
      };

      const ruleId = mapper.registerRule(rule);

      expect(ruleId).toBeDefined();
      expect(typeof ruleId).toBe('string');
      expect(mapper.getStats().totalRules).toBe(1);
    });

    test('应该成功注册条件映射规则', () => {
      const rule = {
        id: 'conditional-rule',
        from: 'axiom:draft',
        to: ['omc:planning', 'omc:design'],
        condition: (context) => context.complexity === 'high',
        weight: 0.9
      };

      const ruleId = mapper.registerRule(rule);

      expect(ruleId).toBe('conditional-rule');
      expect(mapper.getStats().totalRules).toBe(1);
    });

    test('应该自动生成规则 ID', () => {
      const rule = {
        from: 'axiom:draft',
        to: ['omc:planning']
      };

      const ruleId = mapper.registerRule(rule);

      expect(ruleId).toBeDefined();
      expect(typeof ruleId).toBe('string');
    });

    test('应该设置默认权重为 1.0', () => {
      const rule = {
        from: 'axiom:draft',
        to: ['omc:planning']
      };

      const ruleId = mapper.registerRule(rule);
      const storedRule = mapper.getRule(ruleId);

      expect(storedRule.weight).toBe(1.0);
    });

    test('应该拒绝无效的映射规则（缺少 from）', () => {
      const rule = {
        to: ['omc:planning']
      };

      expect(() => mapper.registerRule(rule)).toThrow('映射规则必须包含有效的 from 字段');
    });

    test('应该拒绝无效的映射规则（缺少 to）', () => {
      const rule = {
        from: 'axiom:draft'
      };

      expect(() => mapper.registerRule(rule)).toThrow('映射规则必须包含有效的 to 字段');
    });

    test('应该拒绝无效的映射规则（to 为空数组）', () => {
      const rule = {
        from: 'axiom:draft',
        to: []
      };

      expect(() => mapper.registerRule(rule)).toThrow('to 字段不能为空数组');
    });

    test('应该拒绝无效的映射规则（condition 不是函数）', () => {
      const rule = {
        from: 'axiom:draft',
        to: ['omc:planning'],
        condition: 'not a function'
      };

      expect(() => mapper.registerRule(rule)).toThrow('condition 必须是一个函数');
    });
  });

  describe('map', () => {
    test('应该正确映射简单规则', () => {
      mapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning'],
        weight: 1.0
      });

      const result = mapper.map('axiom:draft');

      expect(result).toEqual(['omc:planning']);
      expect(mapper.getStats().totalMappings).toBe(1);
    });

    test('应该支持一对多映射', () => {
      mapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning', 'omc:design'],
        weight: 1.0
      });

      const result = mapper.map('axiom:draft');

      expect(result).toEqual(['omc:planning', 'omc:design']);
    });

    test('应该根据条件选择映射', () => {
      mapper.registerRule({
        id: 'high-complexity',
        from: 'axiom:draft',
        to: ['omc:planning', 'omc:design'],
        condition: (context) => context.complexity === 'high',
        weight: 0.9
      });

      mapper.registerRule({
        id: 'low-complexity',
        from: 'axiom:draft',
        to: ['omc:planning'],
        condition: (context) => context.complexity === 'low',
        weight: 0.8
      });

      const highResult = mapper.map('axiom:draft', { complexity: 'high' });
      expect(highResult).toEqual(['omc:planning', 'omc:design']);

      const lowResult = mapper.map('axiom:draft', { complexity: 'low' });
      expect(lowResult).toEqual(['omc:planning']);
    });

    test('应该按权重排序结果', () => {
      mapper.registerRule({
        id: 'rule-1',
        from: 'axiom:draft',
        to: ['omc:planning'],
        weight: 0.8
      });

      mapper.registerRule({
        id: 'rule-2',
        from: 'axiom:draft',
        to: ['omc:design'],
        weight: 0.9
      });

      const result = mapper.map('axiom:draft');

      // 权重更高的规则应该排在前面
      expect(result[0]).toBe('omc:design');
    });

    test('应该去重目标阶段', () => {
      mapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning', 'omc:design'],
        weight: 1.0
      });

      mapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning'], // 重复
        weight: 0.9
      });

      const result = mapper.map('axiom:draft');

      // 应该只包含一次 omc:planning
      expect(result.filter(p => p === 'omc:planning').length).toBe(1);
    });

    test('应该返回空数组当无匹配规则', () => {
      const result = mapper.map('non-existent:phase');

      expect(result).toEqual([]);
    });

    test('应该返回空数组当条件都不满足', () => {
      mapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning'],
        condition: (context) => context.complexity === 'high'
      });

      const result = mapper.map('axiom:draft', { complexity: 'low' });

      expect(result).toEqual([]);
    });

    test('应该处理条件评估错误', () => {
      mapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning'],
        condition: (context) => {
          throw new Error('Condition error');
        }
      });

      const result = mapper.map('axiom:draft');

      // 应该返回空数组，不应该抛出错误
      expect(result).toEqual([]);
    });
  });

  describe('reverseMap', () => {
    test('应该正确反向映射', () => {
      mapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning'],
        weight: 1.0
      });

      const result = mapper.reverseMap('omc:planning');

      expect(result).toEqual(['axiom:draft']);
    });

    test('应该处理多个源阶段', () => {
      mapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning']
      });

      mapper.registerRule({
        from: 'axiom:review',
        to: ['omc:planning']
      });

      const result = mapper.reverseMap('omc:planning');

      expect(result).toContain('axiom:draft');
      expect(result).toContain('axiom:review');
      expect(result.length).toBe(2);
    });

    test('应该根据条件过滤反向映射', () => {
      mapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning'],
        condition: (context) => context.complexity === 'high'
      });

      mapper.registerRule({
        from: 'axiom:review',
        to: ['omc:planning'],
        condition: (context) => context.complexity === 'low'
      });

      const highResult = mapper.reverseMap('omc:planning', { complexity: 'high' });
      expect(highResult).toEqual(['axiom:draft']);

      const lowResult = mapper.reverseMap('omc:planning', { complexity: 'low' });
      expect(lowResult).toEqual(['axiom:review']);
    });

    test('应该返回空数组当无匹配规则', () => {
      const result = mapper.reverseMap('non-existent:phase');

      expect(result).toEqual([]);
    });
  });

  describe('customMapper', () => {
    test('应该成功注册自定义映射函数', () => {
      const customFn = (fromPhase, context) => {
        return ['custom:phase'];
      };

      mapper.registerCustomMapper('my-mapper', customFn);

      expect(mapper.customMappers.has('my-mapper')).toBe(true);
    });

    test('应该正确使用自定义映射函数', () => {
      const customFn = (fromPhase, context) => {
        if (context.useCustom) {
          return ['custom:phase1', 'custom:phase2'];
        }
        return ['custom:default'];
      };

      mapper.registerCustomMapper('my-mapper', customFn);

      const result1 = mapper.mapWithCustomMapper('my-mapper', 'any:phase', { useCustom: true });
      expect(result1).toEqual(['custom:phase1', 'custom:phase2']);

      const result2 = mapper.mapWithCustomMapper('my-mapper', 'any:phase', { useCustom: false });
      expect(result2).toEqual(['custom:default']);
    });

    test('应该抛出错误当映射器不存在', () => {
      expect(() => {
        mapper.mapWithCustomMapper('non-existent', 'any:phase');
      }).toThrow('自定义映射器不存在');
    });

    test('应该拒绝非函数的映射器', () => {
      expect(() => {
        mapper.registerCustomMapper('invalid', 'not a function');
      }).toThrow('映射函数必须是一个函数');
    });

    test('应该抛出错误当自定义映射器不返回数组', () => {
      const customFn = () => {
        return 'not an array';
      };

      mapper.registerCustomMapper('bad-mapper', customFn);

      expect(() => {
        mapper.mapWithCustomMapper('bad-mapper', 'any:phase');
      }).toThrow('自定义映射器必须返回数组');
    });
  });

  describe('规则管理', () => {
    test('应该获取所有规则', () => {
      mapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning']
      });

      mapper.registerRule({
        from: 'axiom:review',
        to: ['omc:design']
      });

      const rules = mapper.getAllRules();

      expect(rules.length).toBe(2);
    });

    test('应该获取指定规则', () => {
      const ruleId = mapper.registerRule({
        id: 'test-rule',
        from: 'axiom:draft',
        to: ['omc:planning']
      });

      const rule = mapper.getRule(ruleId);

      expect(rule).toBeDefined();
      expect(rule.id).toBe('test-rule');
      expect(rule.from).toBe('axiom:draft');
    });

    test('应该删除规则', () => {
      const ruleId = mapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning']
      });

      const deleted = mapper.deleteRule(ruleId);

      expect(deleted).toBe(true);
      expect(mapper.getStats().totalRules).toBe(0);
      expect(mapper.getRule(ruleId)).toBeNull();
    });

    test('应该清空所有规则', () => {
      mapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning']
      });

      mapper.registerRule({
        from: 'axiom:review',
        to: ['omc:design']
      });

      mapper.clearRules();

      expect(mapper.getStats().totalRules).toBe(0);
      expect(mapper.getAllRules().length).toBe(0);
    });
  });

  describe('统计信息', () => {
    test('应该正确统计规则数量', () => {
      mapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning']
      });

      mapper.registerRule({
        from: 'axiom:review',
        to: ['omc:design']
      });

      const stats = mapper.getStats();

      expect(stats.totalRules).toBe(2);
    });

    test('应该正确统计映射次数', () => {
      mapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning']
      });

      mapper.map('axiom:draft');
      mapper.map('axiom:draft');
      mapper.map('axiom:draft');

      const stats = mapper.getStats();

      expect(stats.totalMappings).toBe(3);
    });
  });

  describe('性能测试', () => {
    test('映射操作应该在 10ms 内完成', () => {
      // 注册 100 个规则
      for (let i = 0; i < 100; i++) {
        mapper.registerRule({
          from: `phase:${i}`,
          to: [`target:${i}`],
          weight: Math.random()
        });
      }

      // 测试 1000 次映射
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        mapper.map(`phase:${i % 100}`);
      }
      const duration = Date.now() - start;

      // 平均每次映射应该 < 10ms
      const avgTime = duration / 1000;
      expect(avgTime).toBeLessThan(10);
    });
  });
});
