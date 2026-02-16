#!/bin/bash

# GitHub Repository Configuration Script
# This script automates the GitHub repository setup

REPO_OWNER="liangjie559567"
REPO_NAME="axiom-omc-integration"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     GitHub Repository Configuration Script                 ║"
echo "║     Repository: $REPO_OWNER/$REPO_NAME                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo ""
    echo "Please install it first:"
    echo "  - macOS: brew install gh"
    echo "  - Windows: winget install GitHub.cli"
    echo "  - Linux: See https://github.com/cli/cli#installation"
    echo ""
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo ""
    echo "Please run: gh auth login"
    echo ""
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Function to add topics
add_topics() {
    echo "📝 Adding repository topics..."

    TOPICS=(
        "claude-code"
        "agent-system"
        "workflow-automation"
        "cli-tool"
        "plugin"
        "javascript"
        "nodejs"
        "ai-agents"
        "development-tools"
        "integration-platform"
        "memory-management"
        "knowledge-graph"
        "state-synchronization"
        "workflow-integration"
    )

    # Use GitHub API to add topics
    gh api repos/$REPO_OWNER/$REPO_NAME/topics \
        -X PUT \
        -f names="$(IFS=,; echo "${TOPICS[*]}")" \
        -H "Accept: application/vnd.github.mercy-preview+json" \
        && echo "✅ Topics added successfully" \
        || echo "❌ Failed to add topics"

    echo ""
}

# Function to update repository description
update_description() {
    echo "📝 Updating repository description..."

    DESCRIPTION="Unified intelligent development workflow platform with 32 professional agents, 25 CLI commands, and Claude Code plugin support. Features include agent system, workflow integration, memory management, and state synchronization."

    gh api repos/$REPO_OWNER/$REPO_NAME \
        -X PATCH \
        -f description="$DESCRIPTION" \
        && echo "✅ Description updated successfully" \
        || echo "❌ Failed to update description"

    echo ""
}

# Function to set default branch
set_default_branch() {
    echo "📝 Setting default branch to 'main'..."

    gh api repos/$REPO_OWNER/$REPO_NAME \
        -X PATCH \
        -f default_branch="main" \
        && echo "✅ Default branch set to 'main'" \
        || echo "❌ Failed to set default branch"

    echo ""
}

# Function to delete master branch
delete_master_branch() {
    echo "📝 Checking if 'master' branch exists..."

    if gh api repos/$REPO_OWNER/$REPO_NAME/branches/master &> /dev/null; then
        echo "🗑️  Deleting 'master' branch..."
        gh api repos/$REPO_OWNER/$REPO_NAME/git/refs/heads/master \
            -X DELETE \
            && echo "✅ 'master' branch deleted" \
            || echo "❌ Failed to delete 'master' branch (may need to change default branch first)"
    else
        echo "ℹ️  'master' branch does not exist or already deleted"
    fi

    echo ""
}

# Function to create release
create_release() {
    echo "📝 Creating release v2.1.0..."

    # Check if release already exists
    if gh release view v2.1.0 -R $REPO_OWNER/$REPO_NAME &> /dev/null; then
        echo "ℹ️  Release v2.1.0 already exists"
        echo ""
        return
    fi

    # Create release with notes from CHANGELOG.md
    gh release create v2.1.0 \
        -R $REPO_OWNER/$REPO_NAME \
        --title "v2.1.0 - Initial Release" \
        --notes-file CHANGELOG.md \
        --latest \
        && echo "✅ Release v2.1.0 created successfully" \
        || echo "❌ Failed to create release"

    echo ""
}

# Main execution
echo "Starting configuration..."
echo ""

# Execute configuration steps
update_description
add_topics
set_default_branch
delete_master_branch
create_release

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Configuration Complete!                                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Repository configured successfully!"
echo ""
echo "Visit your repository:"
echo "https://github.com/$REPO_OWNER/$REPO_NAME"
echo ""
