/**
 * TemplateManager 和 TDD 模板使用示例
 *
 * 演示如何使用 TemplateManager 管理工作流模板
 */

import { TemplateManager } from '../src/core/template-manager.js';
import { WorkflowIntegration } from '../src/core/workflow-integration.js';
import { tddWorkflowTemplate, createTDDWorkflow } from '../src/templates/tdd-workflow.js';

console.log('=== TemplateManager 和 TDD 模板使用示例 ===\n');

// 1. 创建依赖实例
const workflowIntegration = new WorkflowIntegration();
const templateManager = new TemplateManager(workflowIntegration);

console.log('✓ TemplateManager 已创建\n');

// 2. 注册 TDD 模板
console.log('--- 示例 1: 注册 TDD 模板 ---');
const templateId = templateManager.registerTemplate(tddWorkflowTemplate);
console.log('✓ TDD 模板已注册:', templateId);

const template = templateManager.getTemplate('tdd-workflow');
console.log('\n模板信息:');
console.log('  名称:', template.name);
console.log('  描述:', template.description);
console.log('  工作流 ID:', template.workflowId);
console.log('  阶段数量:', template.phases.length);
console.log('\n阶段列表:');
template.phases.forEach((phase, index) => {
  console.log(`  ${index + 1}. ${phase.name} (${phase.id})`);
  console.log(`     描述: ${phase.description}`);
  console.log(`     下一阶段: ${phase.nextPhase}`);
});
console.log();

// 3. 从模板创建工作流
console.log('--- 示例 2: 从模板创建工作流 ---');
const instance1 = await templateManager.createFromTemplate('tdd-workflow', {
  context: {
    feature: 'user-authentication',
    testFramework: 'jest',
    language: 'javascript'
  }
});

console.log('✓ 工作流实例已创建:');
console.log('  实例 ID:', instance1.instanceId);
console.log('  工作流 ID:', instance1.workflowId);
console.log('  功能:', instance1.context.feature);
console.log('  测试框架:', instance1.context.testFramework);
console.log('  语言:', instance1.context.language);
console.log();

// 4. 使用默认上下文
console.log('--- 示例 3: 使用默认上下文 ---');
const instance2 = await templateManager.createFromTemplate('tdd-workflow', {
  context: {
    feature: 'shopping-cart'
  }
});

console.log('✓ 使用默认配置创建工作流:');
console.log('  功能:', instance2.context.feature);
console.log('  方法论:', instance2.context.methodology); // 默认: TDD
console.log('  测试框架:', instance2.context.testFramework); // 默认: jest
console.log('  语言:', instance2.context.language); // 默认: javascript
console.log();

// 5. 覆盖默认上下文
console.log('--- 示例 4: 覆盖默认上下文 ---');
const instance3 = await templateManager.createFromTemplate('tdd-workflow', {
  context: {
    feature: 'payment-processing',
    testFramework: 'vitest', // 覆盖默认值
    language: 'typescript' // 覆盖默认值
  }
});

console.log('✓ 使用自定义配置创建工作流:');
console.log('  功能:', instance3.context.feature);
console.log('  测试框架:', instance3.context.testFramework); // vitest
console.log('  语言:', instance3.context.language); // typescript
console.log();

// 6. TDD 工作流循环演示
console.log('--- 示例 5: TDD 工作流循环 ---');
console.log('TDD 循环: RED -> GREEN -> REFACTOR -> RED -> ...\n');

console.log('第一轮循环:');
console.log('  1. RED: 编写失败的测试');
console.log('     - 测试: test("should authenticate user with valid credentials")');
console.log('     - 结果: ❌ 测试失败（预期）\n');

console.log('  2. GREEN: 让测试通过');
console.log('     - 代码: function login(user, pass) { return true; }');
console.log('     - 结果: ✅ 测试通过\n');

console.log('  3. REFACTOR: 重构代码');
console.log('     - 重构: 添加真实的验证逻辑');
console.log('     - 结果: ✅ 测试仍然通过\n');

console.log('第二轮循环:');
console.log('  1. RED: 编写新的失败测试');
console.log('     - 测试: test("should reject invalid credentials")');
console.log('     - 结果: ❌ 测试失败（预期）\n');

console.log('  ... 继续循环 ...\n');

// 7. TDD 最佳实践
console.log('--- 示例 6: TDD 最佳实践 ---');
console.log('原则:');
template.guidelines.red.forEach((guideline, index) => {
  console.log(`  ${index + 1}. ${guideline}`);
});

console.log('\nGREEN 阶段指南:');
template.guidelines.green.forEach((guideline, index) => {
  console.log(`  ${index + 1}. ${guideline}`);
});

console.log('\nREFACTOR 阶段指南:');
template.guidelines.refactor.forEach((guideline, index) => {
  console.log(`  ${index + 1}. ${guideline}`);
});
console.log();

// 8. 查看所有模板
console.log('--- 示例 7: 查看所有模板 ---');
const allTemplates = templateManager.getAllTemplates();
console.log('已注册的模板数量:', allTemplates.length);
allTemplates.forEach((t, index) => {
  console.log(`\n模板 ${index + 1}:`);
  console.log('  ID:', t.id);
  console.log('  名称:', t.name);
  console.log('  描述:', t.description);
  console.log('  阶段数:', t.phases.length);
});
console.log();

// 9. 统计信息
console.log('--- 示例 8: 统计信息 ---');
const stats = templateManager.getStats();
console.log('统计信息:');
console.log('  总模板数:', stats.totalTemplates);
console.log('  总创建数:', stats.totalCreated);
console.log();

// 10. 注册自定义模板
console.log('--- 示例 9: 注册自定义模板 ---');
const customTemplate = {
  id: 'debug-workflow',
  name: '调试工作流',
  description: '系统化的调试流程',
  workflowId: 'debug-default',
  phases: [
    {
      id: 'reproduce',
      name: '重现问题',
      description: '确保能够稳定重现问题'
    },
    {
      id: 'isolate',
      name: '隔离问题',
      description: '缩小问题范围，找到根本原因'
    },
    {
      id: 'fix',
      name: '修复问题',
      description: '实施修复方案'
    },
    {
      id: 'verify',
      name: '验证修复',
      description: '确认问题已解决'
    }
  ],
  defaultContext: {
    methodology: 'systematic-debugging'
  }
};

templateManager.registerTemplate(customTemplate);
console.log('✓ 自定义模板已注册:', customTemplate.id);

const debugInstance = await templateManager.createFromTemplate('debug-workflow', {
  context: {
    bug: 'login-timeout-issue'
  }
});

console.log('✓ 从自定义模板创建工作流:', debugInstance.instanceId);
console.log();

// 11. 实际使用场景
console.log('--- 示例 10: 实际使用场景 ---');
console.log('场景 1: 开发新功能');
console.log('  1. 使用 TDD 模板创建工作流');
console.log('  2. RED: 编写测试用例');
console.log('  3. GREEN: 实现功能');
console.log('  4. REFACTOR: 优化代码');
console.log('  5. 重复循环直到功能完成\n');

console.log('场景 2: 修复 Bug');
console.log('  1. 使用调试模板创建工作流');
console.log('  2. REPRODUCE: 重现问题');
console.log('  3. ISOLATE: 找到根本原因');
console.log('  4. FIX: 实施修复');
console.log('  5. VERIFY: 验证修复\n');

console.log('场景 3: 代码审查');
console.log('  1. 创建代码审查模板');
console.log('  2. 按照模板流程进行审查');
console.log('  3. 记录审查结果');
console.log('  4. 跟踪改进项\n');

// 12. 使用辅助函数
console.log('--- 示例 11: 使用辅助函数 ---');
const tddInstance = await createTDDWorkflow(templateManager, {
  feature: 'email-validation',
  testFramework: 'mocha'
});

console.log('✓ 使用辅助函数创建 TDD 工作流:');
console.log('  实例 ID:', tddInstance.instanceId);
console.log('  功能:', tddInstance.context.feature);
console.log('  测试框架:', tddInstance.context.testFramework);
console.log();

// 13. 清理资源
console.log('--- 清理资源 ---');
templateManager.destroy();
console.log('✓ TemplateManager 已销毁\n');

console.log('=== 示例完成 ===');
console.log('\n关键要点:');
console.log('1. TemplateManager 管理工作流模板');
console.log('2. TDD 模板遵循 RED -> GREEN -> REFACTOR 循环');
console.log('3. 模板支持默认上下文和参数覆盖');
console.log('4. 可以注册自定义模板');
console.log('5. 模板验证确保数据完整性');
console.log('6. 完整的统计信息追踪');
console.log('7. MVP 版本包含 1 个预定义模板（TDD）');
