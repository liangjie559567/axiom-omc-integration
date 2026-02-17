/**
 * 代码审查工作流示例
 *
 * 演示如何使用代码审查工作流模板进行标准化代码审查
 */

import { WorkflowOrchestrator } from '../src/core/workflow-orchestrator.js';
import { WorkflowIntegration } from '../src/core/workflow-integration.js';
import { codeReviewWorkflowTemplate, CodeReviewWorkflowHelper } from '../src/templates/code-review-workflow.js';

console.log('=== 代码审查工作流示例 ===\n');

// 1. 初始化系统
const workflowIntegration = new WorkflowIntegration();
const orchestrator = new WorkflowOrchestrator(workflowIntegration);

// 2. 注册代码审查工作流模板
orchestrator.templateManager.registerTemplate(codeReviewWorkflowTemplate);
console.log('✓ 代码审查工作流模板已注册\n');

// 3. 创建代码审查会话
const prInfo = {
  id: 456,
  title: 'Add user authentication feature',
  author: 'developer-1',
  branch: 'feature/user-auth',
  filesChanged: 12,
  linesAdded: 450,
  linesDeleted: 80
};

const reviewSession = CodeReviewWorkflowHelper.createReviewSession(prInfo, {
  priority: 'high',
  reviewers: ['reviewer-1', 'reviewer-2']
});

console.log('代码审查会话已创建:');
console.log(`  会话 ID: ${reviewSession.id}`);
console.log(`  PR: #${reviewSession.pullRequest.id} - ${reviewSession.pullRequest.title}`);
console.log(`  作者: ${reviewSession.pullRequest.author}`);
console.log(`  当前阶段: ${reviewSession.currentPhase}`);
console.log(`  优先级: ${reviewSession.context.priority}\n`);

// 4. PREPARE 阶段 - 准备审查
console.log('=== 阶段 1: PREPARE - 准备审查 ===');

const preparePhase = codeReviewWorkflowTemplate.phases[0];
console.log('任务:');
preparePhase.tasks.forEach((task, index) => {
  console.log(`  ${index + 1}. ${task}`);
});
console.log();

// 作者准备工作
CodeReviewWorkflowHelper.recordChange(
  reviewSession,
  '运行所有测试并确保通过',
  ['tests/auth.test.js', 'tests/user.test.js']
);

CodeReviewWorkflowHelper.recordChange(
  reviewSession,
  '更新 API 文档',
  ['docs/api.md']
);

console.log('✓ 准备工作已完成\n');

// 5. REVIEW 阶段 - 执行审查
console.log('=== 阶段 2: REVIEW - 执行审查 ===');
reviewSession.currentPhase = 'review';

// 获取审查检查清单
const checklist = CodeReviewWorkflowHelper.getReviewChecklist();
console.log('审查检查清单:');
console.log('  代码质量:');
checklist.codeQuality.forEach((item, index) => {
  console.log(`    ${index + 1}. ${item}`);
});
console.log();

// 审查者添加意见
CodeReviewWorkflowHelper.addComment(
  reviewSession,
  'review',
  '代码风格良好，命名清晰',
  'info'
);

CodeReviewWorkflowHelper.addComment(
  reviewSession,
  'review',
  '建议添加输入验证：用户名长度应该在 3-20 个字符之间',
  'warning'
);

CodeReviewWorkflowHelper.addComment(
  reviewSession,
  'review',
  '安全问题：密码应该使用 bcrypt 加密，当前使用的是明文存储',
  'blocker'
);

CodeReviewWorkflowHelper.addComment(
  reviewSession,
  'review',
  '测试覆盖率不足：缺少边界情况测试',
  'error'
);

console.log(`✓ 审查完成，添加了 ${reviewSession.comments.length} 条意见\n`);

// 6. 检查是否可以批准
console.log('=== 批准检查 ===');
let approvalCheck = CodeReviewWorkflowHelper.canApprove(reviewSession);

console.log('批准状态:');
console.log(`  可以批准: ${approvalCheck.canApprove ? '否' : '是'}`);
console.log(`  阻塞问题: ${approvalCheck.blockers} 个`);
console.log(`  错误: ${approvalCheck.errors} 个`);
console.log(`  警告: ${approvalCheck.warnings} 个`);
console.log();

if (!approvalCheck.canApprove) {
  console.log('⚠️  存在阻塞问题，需要先解决\n');
}

// 7. DISCUSS 阶段 - 讨论反馈
console.log('=== 阶段 3: DISCUSS - 讨论反馈 ===');
reviewSession.currentPhase = 'discuss';

// 获取最佳实践
const bestPractices = CodeReviewWorkflowHelper.getBestPractices();
console.log('作者最佳实践:');
bestPractices.forAuthors.forEach((practice, index) => {
  console.log(`  ${index + 1}. ${practice}`);
});
console.log();

// 作者修复问题
CodeReviewWorkflowHelper.recordChange(
  reviewSession,
  '修复安全问题：使用 bcrypt 加密密码',
  ['src/auth/password.js']
);

CodeReviewWorkflowHelper.recordChange(
  reviewSession,
  '添加输入验证和边界测试',
  ['src/auth/validator.js', 'tests/auth.test.js']
);

// 解决意见
CodeReviewWorkflowHelper.resolveComment(reviewSession, 2); // 安全问题
CodeReviewWorkflowHelper.resolveComment(reviewSession, 3); // 测试覆盖率

console.log('✓ 问题已修复，意见已解决\n');

// 8. 再次检查是否可以批准
console.log('=== 再次批准检查 ===');
approvalCheck = CodeReviewWorkflowHelper.canApprove(reviewSession);

console.log('批准状态:');
console.log(`  可以批准: ${approvalCheck.canApprove ? '是' : '否'}`);
console.log(`  阻塞问题: ${approvalCheck.blockers} 个`);
console.log(`  错误: ${approvalCheck.errors} 个`);
console.log(`  警告: ${approvalCheck.warnings} 个`);
console.log();

if (approvalCheck.canApprove) {
  console.log('✓ 所有阻塞问题已解决，可以批准\n');
}

// 9. APPROVE 阶段 - 批准合并
console.log('=== 阶段 4: APPROVE - 批准合并 ===');
reviewSession.currentPhase = 'approve';

// 审查者批准
CodeReviewWorkflowHelper.addApproval(reviewSession, 'reviewer-1', true);
CodeReviewWorkflowHelper.addApproval(reviewSession, 'reviewer-2', true);

console.log(`✓ 获得 ${reviewSession.approvals.length} 个批准\n`);

// 10. 生成审查报告
console.log('=== 审查报告 ===');
const report = CodeReviewWorkflowHelper.generateReport(reviewSession);

console.log(`会话 ID: ${report.sessionId}`);
console.log(`PR: #${report.pullRequest.id} - ${report.pullRequest.title}`);
console.log(`总耗时: ${report.duration}`);
console.log();

console.log('摘要:');
console.log(`  总意见数: ${report.summary.totalComments}`);
console.log(`  已解决: ${report.summary.resolvedComments}`);
console.log(`  未解决: ${report.summary.unresolvedComments}`);
console.log(`  阻塞问题: ${report.summary.blockers}`);
console.log(`  总批准数: ${report.summary.totalApprovals}`);
console.log(`  批准: ${report.summary.approved}`);
console.log(`  总变更数: ${report.summary.totalChanges}`);
console.log();

console.log('各阶段意见:');
console.log(`  PREPARE: ${report.commentsByPhase.prepare.length} 条`);
console.log(`  REVIEW: ${report.commentsByPhase.review.length} 条`);
console.log(`  DISCUSS: ${report.commentsByPhase.discuss.length} 条`);
console.log(`  APPROVE: ${report.commentsByPhase.approve.length} 条`);
console.log();

console.log('按严重级别:');
console.log(`  阻塞: ${report.commentsBySeverity.blocker.length} 条`);
console.log(`  错误: ${report.commentsBySeverity.error.length} 条`);
console.log(`  警告: ${report.commentsBySeverity.warning.length} 条`);
console.log(`  信息: ${report.commentsBySeverity.info.length} 条`);
console.log();

// 11. 使用 WorkflowOrchestrator 创建代码审查工作流实例
console.log('=== 使用 WorkflowOrchestrator ===');

// 注册代码审查工作流
workflowIntegration.registerWorkflow({
  id: 'code-review-default',
  name: 'Code Review Workflow',
  type: 'code-review',
  phases: codeReviewWorkflowTemplate.phases.map(p => ({
    id: p.id,
    name: p.name
  }))
});

// 从模板创建工作流实例
const reviewInstance = await orchestrator.createFromTemplate('code-review-workflow', {
  pullRequest: prInfo,
  priority: 'high'
});

console.log('代码审查工作流实例已创建:');
console.log(`  实例 ID: ${reviewInstance.id}`);
console.log(`  工作流 ID: ${reviewInstance.workflowId}`);
console.log(`  当前阶段: ${reviewInstance.currentPhase.id}`);
console.log();

// 获取意见模板
const templates = CodeReviewWorkflowHelper.getCommentTemplates();
console.log('常用意见模板:');
console.log(`  代码风格: ${templates.codeStyle}`);
console.log(`  逻辑问题: ${templates.logic}`);
console.log(`  性能问题: ${templates.performance}`);
console.log(`  安全问题: ${templates.security}`);
console.log(`  表扬: ${templates.praise}`);

console.log('\n=== 示例完成 ===');
