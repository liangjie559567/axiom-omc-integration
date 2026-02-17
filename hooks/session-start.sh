#!/bin/bash
# Session Start Hook
# 在会话启动时执行

echo "================================================"
echo "  Axiom-OMC Integration - Session Started"
echo "================================================"
echo "Time: $(date)"
echo "User: ${USER:-Unknown}"
echo "Working Directory: $(pwd)"
echo ""
echo "Available Workflows:"
echo "  - brainstorming"
echo "  - writing-plans"
echo "  - executing-plans"
echo "  - test-driven-development"
echo "  - systematic-debugging"
echo ""
echo "Tip: Use 'help' command to see all available commands"
echo "================================================"
