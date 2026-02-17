#!/bin/bash
# Workflow Start Hook
# 在工作流启动时执行

WORKFLOW_NAME="${1:-Unknown}"

echo "================================================"
echo "  Starting Workflow: ${WORKFLOW_NAME}"
echo "================================================"
echo "Time: $(date)"
echo ""

# 根据不同工作流提供提示
case "${WORKFLOW_NAME}" in
  "brainstorming")
    echo "📋 Brainstorming Workflow"
    echo "   - Clarify requirements"
    echo "   - Explore design options"
    echo "   - Document decisions"
    ;;
  "writing-plans")
    echo "📝 Writing Plans Workflow"
    echo "   - Break down into tasks"
    echo "   - Define acceptance criteria"
    echo "   - Estimate complexity"
    ;;
  "executing-plans")
    echo "⚙️  Executing Plans Workflow"
    echo "   - Follow TDD cycle"
    echo "   - Implement incrementally"
    echo "   - Verify at checkpoints"
    ;;
  "test-driven-development")
    echo "🧪 TDD Workflow"
    echo "   - RED: Write failing test"
    echo "   - GREEN: Make it pass"
    echo "   - REFACTOR: Improve code"
    ;;
  "systematic-debugging")
    echo "🔍 Systematic Debugging Workflow"
    echo "   - Reproduce the issue"
    echo "   - Isolate the cause"
    echo "   - Fix the root cause"
    echo "   - Verify the fix"
    ;;
  *)
    echo "🚀 Custom Workflow: ${WORKFLOW_NAME}"
    ;;
esac

echo ""
echo "================================================"
