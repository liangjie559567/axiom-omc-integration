/**
 * PhaseMapper 使用示例
 *
 * 演示如何使用 PhaseMapper 进行智能阶段映射
 */

import { PhaseMapper } from '../src/core/phase-mapper.js';

console.log('=== PhaseMapper 使用示例 ===\n');

// 1. 创建 PhaseMapper 实例
const mapper = new PhaseMapper();
console.log('✓ PhaseMapper 已创建\n');

// 2. 注册简单映射规则
console.log('--- 示例 1: 简单映射 ---');
mapper.registerRule({
  id: 'axiom-draft-to-omc-planning',
  from: 'axiom:draft',
  to: ['omc:planning'],
  weight: 1.0
});

const result1 = mapper.map('axiom:draft');
console.log('映射结果:', result1);
console.log('✓ axiom:draft -> omc:planning\n');

// 3. 注册一对多映射规则
console.log('--- 示例 2: 一对多映射 ---');
mapper.registerRule({
  id: 'axiom-implement-to-omc-multi',
  from: 'axiom:implement',
  to: ['omc:implementation', 'omc:testing'],
  weight: 1.0
});

const result2 = mapper.map('axiom:implement');
console.log('映射结果:', result2);
console.log('✓ axiom:implement -> [omc:implementation, omc:testing]\n');

// 4. 注册条件映射规则
console.log('--- 示例 3: 条件映射 ---');
mapper.registerRule({
  id: 'complex-draft-mapping',
  from: 'axiom:draft',
  to: ['omc:planning', 'omc:design'],
  condition: (context) => context.complexity === 'high',
  weight: 0.9
});

const result3a = mapper.map('axiom:draft', { complexity: 'high' });
console.log('高复杂度映射结果:', result3a);
console.log('✓ 条件满足: complexity === "high"');

const result3b = mapper.map('axiom:draft', { complexity: 'low' });
console.log('低复杂度映射结果:', result3b);
console.log('✓ 条件不满足，使用默认规则\n');

// 5. 权重排序
console.log('--- 示例 4: 权重排序 ---');
mapper.clearRules(); // 清空之前的规则

mapper.registerRule({
  id: 'rule-low-weight',
  from: 'test:phase',
  to: ['target:a'],
  weight: 0.5
});

mapper.registerRule({
  id: 'rule-high-weight',
  from: 'test:phase',
  to: ['target:b'],
  weight: 0.9
});

const result4 = mapper.map('test:phase');
console.log('映射结果（按权重排序）:', result4);
console.log('✓ 权重更高的规则优先: target:b (0.9) -> target:a (0.5)\n');

// 6. 反向映射
console.log('--- 示例 5: 反向映射 ---');
mapper.clearRules();

mapper.registerRule({
  from: 'axiom:draft',
  to: ['omc:planning']
});

mapper.registerRule({
  from: 'axiom:review',
  to: ['omc:planning']
});

const result5 = mapper.reverseMap('omc:planning');
console.log('反向映射结果:', result5);
console.log('✓ omc:planning <- [axiom:draft, axiom:review]\n');

// 7. 自定义映射函数
console.log('--- 示例 6: 自定义映射函数 ---');
mapper.registerCustomMapper('dynamic-mapper', (fromPhase, context) => {
  if (context.environment === 'production') {
    return ['prod:phase1', 'prod:phase2'];
  } else if (context.environment === 'staging') {
    return ['staging:phase1'];
  } else {
    return ['dev:phase1'];
  }
});

const result6a = mapper.mapWithCustomMapper('dynamic-mapper', 'any:phase', {
  environment: 'production'
});
console.log('生产环境映射:', result6a);

const result6b = mapper.mapWithCustomMapper('dynamic-mapper', 'any:phase', {
  environment: 'staging'
});
console.log('预发环境映射:', result6b);

const result6c = mapper.mapWithCustomMapper('dynamic-mapper', 'any:phase', {
  environment: 'development'
});
console.log('开发环境映射:', result6c);
console.log('✓ 自定义映射函数根据上下文动态决定\n');

// 8. 统计信息
console.log('--- 示例 7: 统计信息 ---');
const stats = mapper.getStats();
console.log('统计信息:', {
  totalRules: stats.totalRules,
  totalMappings: stats.totalMappings
});
console.log('✓ 可以追踪映射引擎的使用情况\n');

// 9. 实际场景：Axiom 和 OMC 工作流映射
console.log('--- 示例 8: 实际场景 - Axiom 和 OMC 工作流映射 ---');
mapper.clearRules();

// 注册 Axiom -> OMC 映射规则
mapper.registerRule({
  id: 'axiom-draft-to-omc-planning',
  from: 'axiom:draft',
  to: ['omc:planning'],
  weight: 1.0
});

mapper.registerRule({
  id: 'axiom-review-to-omc-design',
  from: 'axiom:review',
  to: ['omc:design'],
  weight: 1.0
});

mapper.registerRule({
  id: 'axiom-implement-to-omc-impl',
  from: 'axiom:implement',
  to: ['omc:implementation'],
  weight: 1.0
});

// 复杂项目的特殊映射
mapper.registerRule({
  id: 'complex-project-mapping',
  from: 'axiom:draft',
  to: ['omc:planning', 'omc:design'],
  condition: (context) => context.complexity === 'high' && context.requiresDesign,
  weight: 0.95
});

console.log('场景 1: 简单项目的草稿阶段');
const scenario1 = mapper.map('axiom:draft', {
  complexity: 'low',
  requiresDesign: false
});
console.log('映射结果:', scenario1);

console.log('\n场景 2: 复杂项目的草稿阶段（需要设计）');
const scenario2 = mapper.map('axiom:draft', {
  complexity: 'high',
  requiresDesign: true
});
console.log('映射结果:', scenario2);

console.log('\n场景 3: 审查阶段');
const scenario3 = mapper.map('axiom:review');
console.log('映射结果:', scenario3);

console.log('\n场景 4: 实现阶段');
const scenario4 = mapper.map('axiom:implement');
console.log('映射结果:', scenario4);

console.log('\n✓ PhaseMapper 可以根据项目复杂度智能选择映射策略\n');

console.log('=== 示例完成 ===');
