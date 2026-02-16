#!/bin/bash
# GitHub Configuration Commands
# Run these commands one by one after logging in with: gh auth login

echo "Starting GitHub repository configuration..."
echo ""

# 1. Update repository description
echo "1/5 Updating repository description..."
gh api repos/liangjie559567/axiom-omc-integration -X PATCH \
  -f description="Unified intelligent development workflow platform with 32 professional agents, 25 CLI commands, and Claude Code plugin support. Features include agent system, workflow integration, memory management, and state synchronization."

echo "✅ Description updated"
echo ""

# 2. Add repository topics
echo "2/5 Adding repository topics..."
gh api repos/liangjie559567/axiom-omc-integration/topics -X PUT \
  -f names='["claude-code","agent-system","workflow-automation","cli-tool","plugin","javascript","nodejs","ai-agents","development-tools","integration-platform","memory-management","knowledge-graph","state-synchronization","workflow-integration"]' \
  -H "Accept: application/vnd.github.mercy-preview+json"

echo "✅ Topics added"
echo ""

# 3. Set default branch to main
echo "3/5 Setting default branch to main..."
gh api repos/liangjie559567/axiom-omc-integration -X PATCH \
  -f default_branch="main"

echo "✅ Default branch set to main"
echo ""

# 4. Delete master branch
echo "4/5 Deleting master branch..."
gh api repos/liangjie559567/axiom-omc-integration/git/refs/heads/master -X DELETE 2>/dev/null || echo "ℹ️  Master branch already deleted or doesn't exist"

echo "✅ Master branch removed"
echo ""

# 5. Create release v2.1.0
echo "5/5 Creating release v2.1.0..."
gh release create v2.1.0 \
  -R liangjie559567/axiom-omc-integration \
  --title "v2.1.0 - Initial Release" \
  --notes-file CHANGELOG.md \
  --latest

echo "✅ Release v2.1.0 created"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Configuration Complete!                                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Repository configured successfully!"
echo ""
echo "Visit your repository:"
echo "https://github.com/liangjie559567/axiom-omc-integration"
