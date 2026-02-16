# MCP Configuration

This file contains instructions for setting up MCP (Model Context Protocol) servers.

## Setup

1. Copy the example configuration:
   ```bash
   cp .mcp.json.example .mcp.json
   ```

2. Edit `.mcp.json` and replace the placeholder values:
   - `your-firecrawl-api-key-here` - Your Firecrawl API key
   - `your-github-token-here` - Your GitHub Personal Access Token
   - Update paths to match your local installation

3. **Important**: Never commit `.mcp.json` to version control as it contains sensitive credentials.

## Required API Keys

### Firecrawl API Key
- Sign up at: https://firecrawl.dev
- Get your API key from the dashboard

### GitHub Personal Access Token
- Go to: https://github.com/settings/tokens
- Generate a new token with appropriate permissions
- Required scopes: `repo`, `read:org`

## MCP Servers Included

- **sequential-thinking**: Sequential thinking support
- **software-planning-tool**: Software planning utilities
- **context7**: Context management
- **firecrawl**: Web scraping and crawling
- **desktop-commander**: Desktop automation
- **github**: GitHub integration

## Security Notes

- `.mcp.json` is listed in `.gitignore` to prevent accidental commits
- Always use environment variables or secure vaults for production deployments
- Rotate your API keys regularly
