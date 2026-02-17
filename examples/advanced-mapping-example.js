/**
 * 高级映射规则示例
 *
 * 演示如何使用 PhaseMapper 创建复杂的映射规则
 */

import { PhaseMapper } from '../src/core/phase-mapper.js';

console.log('=== 高级映射规则示例 ===\n');

// 1. 创建 PhaseMapper 实例
const mapper = new PhaseMapper();
console.log('✓ PhaseMapper 已初始化\n');

// 2. 基础一对一映射
console.log('=== 示例 1: 基础一对一映射 ===');
mapper.registerRule({
  from: 'design',
  to: ['planning'],
  type: 'one-to-one'
});

const result1 = mapper.map('design');
console.log(`映射: design -> ${result1.join(', ')}`);
console.log();

// 3. 一对多映射
console.log('=== 示例 2: 一对多映射 ===');
mapper.registerRule({
  from: 'implementation',
  to: ['coding', 'unit-testing'],
  type: 'one-to-many'
});

const result2 = mapper.map('implementation');
console.log(`映射: implementation -> [${result2.join(', ')}]`);
console.log();

// 4. 条件映射 - 基于上下文
console.log('=== 示例 3: 条件映射（基于上下文）===');
mapper.registerRule({
  from: 'testing',
  to: ['unit-testing'],
  condition: (context) => {
    return context.testType === 'unit';
  }
});

mapper.registerRule({
  from: 'testing',
  to: ['integration-testing'],
  condition: (context) => {
    return context.testType === 'integration';
  }
});

const result3a = mapper.map('testing', { testType: 'unit' });
console.log(`映射（单元测试）: testing -> ${result3a.join(', ')}`);

const result3b = mapper.map('testing', { testType: 'integration' });
console.log(`映射（集成测试）: testing -> ${result3b.join(', ')}`);
console.log();

// 5. 条件映射 - 基于优先级
console.log('=== 示例 4: 条件映射（基于优先级）===');
mapper.registerRule({
  from: 'review',
  to: ['urgent-review'],
  condition: (context) => {
    return context.priority === 'high';
  }
});

mapper.registerRule({
  from: 'review',
  to: ['standard-review'],
  condition: (context) => {
    return context.priority === 'normal';
  }
});

const result4a = mapper.map('review', { priority: 'high' });
console.log(`映射（高优先级）: review -> ${result4a.join(', ')}`);

const result4b = mapper.map('review', { priority: 'normal' });
console.log(`映射（普通优先级）: review -> ${result4b.join(', ')}`);
console.log();

// 6. 复杂条件映射 - 多个条件
console.log('=== 示例 5: 复杂条件映射 ===');
mapper.registerRule({
  from: 'deployment',
  to: ['production-deployment'],
  condition: (context) => {
    return context.environment === 'production' && context.approved === true;
  }
});

mapper.registerRule({
  from: 'deployment',
  to: ['staging-deployment'],
  condition: (context) => {
    return context.environment === 'staging';
  }
});

const result5a = mapper.map('deployment', {
  environment: 'production',
  approved: true
});
console.log(`映射（生产环境，已批准）: deployment -> ${result5a.join(', ')}`);

const result5b = mapper.map('deployment', {
  environment: 'staging'
});
console.log(`映射（预发布环境）: deployment -> ${result5b.join(', ')}`);
console.log();

// 7. 反向映射
console.log('=== 示例 6: 反向映射 ===');
const reverseResult1 = mapper.reverseMap('planning');
console.log(`反向映射: planning -> ${reverseResult1.join(', ')}`);

const reverseResult2 = mapper.reverseMap('coding');
console.log(`反向映射: coding -> ${reverseResult2.join(', ')}`);
console.log();

// 8. 获取所有映射规则
console.log('=== 示例 7: 查看所有映射规则 ===');
const allRules = mapper.getAllRules();
console.log(`总共注册了 ${allRules.length} 条映射规则:`);
allRules.forEach((rule, index) => {
  console.log(`  ${index + 1}. ${rule.from} -> [${rule.to.join(', ')}]`);
});
console.log();

// 9. 获取统计信息
console.log('=== 示例 8: 映射统计 ===');
const stats = mapper.getStats();
console.log('统计信息:');
console.log(`  总规则数: ${stats.totalRules}`);
console.log(`  总映射次数: ${stats.totalMappings}`);
console.log(`  缓存命中: ${stats.cacheHits}`);
console.log();

// 10. 实际应用场景 - 敏捷开发流程映射
console.log('=== 示例 9: 实际应用 - 敏捷开发流程映射 ===');

// 创建新的 mapper 用于敏捷流程
const agileMapper = new PhaseMapper();

// Scrum 到 Kanban 的映射
agileMapper.registerRule({
  from: 'sprint-planning',
  to: ['backlog-refinement']
});

agileMapper.registerRule({
  from: 'sprint-execution',
  to: ['in-progress', 'code-review']
});

agileMapper.registerRule({
  from: 'sprint-review',
  to: ['done']
});

console.log('Scrum 到 Kanban 映射:');
console.log(`  sprint-planning -> ${agileMapper.map('sprint-planning').join(', ')}`);
console.log(`  sprint-execution -> [${agileMapper.map('sprint-execution').join(', ')}]`);
console.log(`  sprint-review -> ${agileMapper.map('sprint-review').join(', ')}`);
console.log();

// 11. 实际应用场景 - CI/CD 流程映射
console.log('=== 示例 10: 实际应用 - CI/CD 流程映射 ===');

const cicdMapper = new PhaseMapper();

// 开发阶段到 CI/CD 阶段的映射
cicdMapper.registerRule({
  from: 'code-commit',
  to: ['build', 'unit-test']
});

cicdMapper.registerRule({
  from: 'pull-request',
  to: ['integration-test', 'security-scan'],
  condition: (context) => context.hasConflicts === false
});

cicdMapper.registerRule({
  from: 'merge',
  to: ['deploy-staging', 'smoke-test'],
  condition: (context) => context.branch === 'main'
});

console.log('CI/CD 流程映射:');
const cicdResult1 = cicdMapper.map('code-commit');
console.log(`  code-commit -> [${cicdResult1.join(', ')}]`);

const cicdResult2 = cicdMapper.map('pull-request', { hasConflicts: false });
console.log(`  pull-request (无冲突) -> [${cicdResult2.join(', ')}]`);

const cicdResult3 = cicdMapper.map('merge', { branch: 'main' });
console.log(`  merge (主分支) -> [${cicdResult3.join(', ')}]`);
console.log();

// 12. 错误处理
console.log('=== 示例 11: 错误处理 ===');
const noMatch = mapper.map('non-existent-phase');
console.log(`✓ 未找到映射返回空数组: [${noMatch.join(', ')}]`);

const noReverse = mapper.reverseMap('non-existent-phase');
console.log(`✓ 反向映射未找到返回空数组: [${noReverse.join(', ')}]`);
console.log();

// 13. 清除规则
console.log('=== 示例 12: 清除规则 ===');
const beforeClear = mapper.getStats();
console.log(`清除前: ${beforeClear.totalRules} 条规则`);

mapper.clearRules();

const afterClear = mapper.getStats();
console.log(`清除后: ${afterClear.totalRules} 条规则`);
console.log();

console.log('=== 示例完成 ===');
console.log('\n关键要点:');
console.log('1. 一对一映射适用于简单的阶段转换');
console.log('2. 一对多映射适用于一个阶段分解为多个阶段');
console.log('3. 条件映射适用于基于上下文的动态映射');
console.log('4. 反向映射可以追溯源阶段');
console.log('5. 统计信息帮助监控映射使用情况');
