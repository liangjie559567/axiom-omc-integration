# GitHub Repository Configuration Script (PowerShell)
# This script automates the GitHub repository setup

$REPO_OWNER = "liangjie559567"
$REPO_NAME = "axiom-omc-integration"

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     GitHub Repository Configuration Script                 ║" -ForegroundColor Cyan
Write-Host "║     Repository: $REPO_OWNER/$REPO_NAME" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if gh CLI is installed
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI (gh) is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install it first:"
    Write-Host "  winget install GitHub.cli"
    Write-Host "  or download from: https://cli.github.com/"
    Write-Host ""
    exit 1
}

# Check if authenticated
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not authenticated with GitHub CLI." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run: gh auth login"
    Write-Host ""
    exit 1
}

Write-Host "✅ GitHub CLI is installed and authenticated" -ForegroundColor Green
Write-Host ""

# Function to add topics
function Add-Topics {
    Write-Host "📝 Adding repository topics..." -ForegroundColor Yellow

    $topics = @(
        "claude-code",
        "agent-system",
        "workflow-automation",
        "cli-tool",
        "plugin",
        "javascript",
        "nodejs",
        "ai-agents",
        "development-tools",
        "integration-platform",
        "memory-management",
        "knowledge-graph",
        "state-synchronization",
        "workflow-integration"
    )

    $topicsJson = $topics | ConvertTo-Json -Compress

    try {
        gh api repos/$REPO_OWNER/$REPO_NAME/topics `
            -X PUT `
            -f names=$topicsJson `
            -H "Accept: application/vnd.github.mercy-preview+json" | Out-Null
        Write-Host "✅ Topics added successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to add topics: $_" -ForegroundColor Red
    }

    Write-Host ""
}

# Function to update repository description
function Update-Description {
    Write-Host "📝 Updating repository description..." -ForegroundColor Yellow

    $description = "Unified intelligent development workflow platform with 32 professional agents, 25 CLI commands, and Claude Code plugin support. Features include agent system, workflow integration, memory management, and state synchronization."

    try {
        gh api repos/$REPO_OWNER/$REPO_NAME `
            -X PATCH `
            -f description="$description" | Out-Null
        Write-Host "✅ Description updated successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to update description: $_" -ForegroundColor Red
    }

    Write-Host ""
}

# Function to set default branch
function Set-DefaultBranch {
    Write-Host "📝 Setting default branch to 'main'..." -ForegroundColor Yellow

    try {
        gh api repos/$REPO_OWNER/$REPO_NAME `
            -X PATCH `
            -f default_branch="main" | Out-Null
        Write-Host "✅ Default branch set to 'main'" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to set default branch: $_" -ForegroundColor Red
    }

    Write-Host ""
}

# Function to delete master branch
function Remove-MasterBranch {
    Write-Host "📝 Checking if 'master' branch exists..." -ForegroundColor Yellow

    try {
        gh api repos/$REPO_OWNER/$REPO_NAME/branches/master 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "🗑️  Deleting 'master' branch..." -ForegroundColor Yellow
            gh api repos/$REPO_OWNER/$REPO_NAME/git/refs/heads/master -X DELETE | Out-Null
            Write-Host "✅ 'master' branch deleted" -ForegroundColor Green
        }
    } catch {
        Write-Host "ℹ️  'master' branch does not exist or already deleted" -ForegroundColor Cyan
    }

    Write-Host ""
}

# Function to create release
function New-Release {
    Write-Host "📝 Creating release v2.1.0..." -ForegroundColor Yellow

    # Check if release already exists
    $releaseExists = gh release view v2.1.0 -R $REPO_OWNER/$REPO_NAME 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "ℹ️  Release v2.1.0 already exists" -ForegroundColor Cyan
        Write-Host ""
        return
    }

    # Create release with notes from CHANGELOG.md
    try {
        gh release create v2.1.0 `
            -R $REPO_OWNER/$REPO_NAME `
            --title "v2.1.0 - Initial Release" `
            --notes-file CHANGELOG.md `
            --latest
        Write-Host "✅ Release v2.1.0 created successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to create release: $_" -ForegroundColor Red
    }

    Write-Host ""
}

# Main execution
Write-Host "Starting configuration..." -ForegroundColor Cyan
Write-Host ""

# Execute configuration steps
Update-Description
Add-Topics
Set-DefaultBranch
Remove-MasterBranch
New-Release

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Configuration Complete!                                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Repository configured successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Visit your repository:"
Write-Host "https://github.com/$REPO_OWNER/$REPO_NAME" -ForegroundColor Cyan
Write-Host ""
