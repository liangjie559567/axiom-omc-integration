# Frequently Asked Questions (FAQ)

Common questions and answers about Axiom-OMC Integration.

---

## 📋 General Questions

### What is Axiom-OMC Integration?

Axiom-OMC Integration is a unified intelligent development workflow platform that combines Axiom, OMC, and Superpowers systems. It provides 32 professional agents, 25 CLI commands, and complete Claude Code plugin support.

### Who should use this project?

- Software developers looking for intelligent workflow automation
- Teams using Claude Code who want enhanced agent capabilities
- Projects requiring memory management and knowledge tracking
- Anyone interested in AI-assisted development workflows

### Is it free to use?

Yes! The project is open source under the MIT License. You can use, modify, and distribute it freely.

### What are the system requirements?

- Node.js >= 18.0.0
- npm >= 9.0.0
- Operating System: Windows, macOS, or Linux

---

## 🚀 Getting Started

### How do I install it?

```bash
# Clone the repository
git clone https://github.com/liangjie559567/axiom-omc-integration.git
cd axiom-omc-integration

# Install dependencies
npm install

# Verify installation
npm test
```

See [QUICKSTART.md](./QUICKSTART.md) for detailed instructions.

### Can I use it as a Claude Code plugin?

Yes! Clone it to your Claude Code plugins directory:

```bash
git clone https://github.com/liangjie559567/axiom-omc-integration.git \
  ~/.claude/plugins/axiom-omc
```

Then activate it in Claude Code:
```
/plugin activate axiom-omc
```

### Where do I start?

1. Read [QUICKSTART.md](./QUICKSTART.md) for a 5-minute introduction
2. Run the examples: `node examples/basic-usage.js`
3. Check the [User Guide](./docs/USER-GUIDE.md) for detailed usage

---

## 🤖 Agent System

### How many agents are available?

32 professional agents across 6 functional lanes:
- Architect Lane (4 agents)
- Executor Lane (5 agents)
- Reviewer Lane (3 agents)
- Optimizer Lane (3 agents)
- Documenter Lane (3 agents)
- Tester Lane (4 agents)

### How do I execute an agent?

```javascript
import { createAgentSystem } from './src/agents/agent-system.js';

const agentSystem = createAgentSystem();
const result = await agentSystem.execute('architect', {
  task: 'Design a REST API'
});
```

Or via CLI:
```bash
node src/cli/index.js agent:execute architect '{"task": "Design a REST API"}'
```

### Can I create custom agents?

Yes! You can register custom agents:

```javascript
agentSystem.registerAgent({
  id: 'my-agent',
  name: 'My Custom Agent',
  lane: 'custom',
  capabilities: ['custom-task'],
  execute: async (input) => {
    // Your agent logic
    return { success: true, result: 'Done!' };
  }
});
```

### How do agents differ from each other?

Each agent specializes in specific tasks:
- **architect**: System design and architecture
- **frontend-dev**: Frontend development
- **code-reviewer**: Code quality review
- **performance-optimizer**: Performance optimization
- etc.

See [API Reference](./docs/API-REFERENCE.md) for complete agent descriptions.

---

## 💾 Memory System

### What is the memory system?

The memory system provides:
- **Decision tracking**: Record and query decisions
- **Knowledge graph**: Build relationships between concepts
- **Pattern extraction**: Automatically learn from experience
- **Persistent storage**: Save data across sessions

### How do I use the memory system?

```javascript
import { createMemorySystem } from './src/core/memory-system.js';

const memory = createMemorySystem();
await memory.initialize();

// Add a decision
await memory.addDecision({
  title: 'Use PostgreSQL',
  description: 'Decided to use PostgreSQL for database',
  rationale: 'Need ACID compliance',
  tags: ['database']
});

// Search knowledge
const results = await memory.searchKnowledge('database');
```

### Where is memory data stored?

By default, memory data is stored in `.omc/memory/` directory as JSON files. You can configure the storage location:

```javascript
const memory = createMemorySystem({
  storageDir: '/custom/path/memory'
});
```

### Can I export/import memory data?

Yes! Memory data is stored as JSON files, so you can:
- Copy the `.omc/memory/` directory to backup
- Share memory data between projects
- Version control memory data with Git

---

## 🔄 Workflows

### What workflows are available?

Two built-in workflows:
1. **Axiom Workflow** (3 phases): Draft → Review → Implement
2. **OMC Workflow** (5 phases): Planning → Design → Implementation → Testing → Deployment

### How do I start a workflow?

```javascript
import { createWorkflowIntegration } from './src/core/workflow-integration.js';

const workflow = createWorkflowIntegration();
const instance = await workflow.startWorkflow('omc-default', {
  projectName: 'My Project'
});
```

Or via CLI:
```bash
node src/cli/index.js workflow:start omc-default
```

### Can I create custom workflows?

Yes! Register a custom workflow:

```javascript
workflow.registerWorkflow({
  id: 'my-workflow',
  name: 'My Custom Workflow',
  phases: [
    { id: 'phase1', name: 'Phase 1' },
    { id: 'phase2', name: 'Phase 2' }
  ],
  transitions: [
    { from: 'phase1', to: 'phase2' }
  ]
});
```

---

## 🔧 Configuration

### How do I configure the system?

Create a `.axiom-omc.json` file in your project root:

```json
{
  "agent": {
    "maxConcurrent": 5,
    "timeout": 300000
  },
  "memory": {
    "storageDir": ".omc/memory"
  },
  "workflow": {
    "defaultWorkflowType": "omc"
  }
}
```

### What about MCP configuration?

Copy the example file and add your API keys:

```bash
cp .mcp.json.example .mcp.json
# Edit .mcp.json with your keys
```

See [MCP-SETUP.md](./MCP-SETUP.md) for details.

### Can I use environment variables?

Yes! You can use environment variables for sensitive configuration:

```javascript
const config = {
  apiKey: process.env.API_KEY,
  storageDir: process.env.STORAGE_DIR || '.omc/memory'
};
```

---

## 🧪 Testing

### How do I run tests?

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration

# Run with coverage
npm run test:coverage
```

### What is the test coverage?

Current test coverage: **92.3%**

- 469 tests total
- 383 unit tests
- 62 integration tests
- 24 performance tests

### How do I add tests?

Create a test file in `tests/unit/` or `tests/integration/`:

```javascript
import { describe, test, expect } from '@jest/globals';
import { myFunction } from '../src/my-module.js';

describe('My Module', () => {
  test('should work correctly', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

---

## 🐛 Troubleshooting

### Installation fails with "Module not found"

**Solution**: Make sure you're using Node.js >= 18.0.0:
```bash
node --version  # Should be >= 18.0.0
npm install
```

### Tests fail on Windows

**Solution**: Some tests may have path issues on Windows. Make sure you're using the latest version and report any issues on GitHub.

### Memory system doesn't persist data

**Solution**: Ensure the storage directory exists and is writable:
```bash
mkdir -p .omc/memory
```

### Agent execution times out

**Solution**: Increase the timeout in configuration:
```javascript
const agentSystem = createAgentSystem({
  timeout: 600000  // 10 minutes
});
```

### "Permission denied" errors

**Solution**: Check file permissions:
```bash
chmod -R 755 .omc/
```

---

## 🔒 Security

### Is it safe to use?

Yes! The project follows security best practices:
- No hardcoded credentials
- Input validation
- Secure file operations
- Regular dependency updates

See [SECURITY.md](./SECURITY.md) for details.

### How do I report security issues?

Please report security vulnerabilities privately via:
- GitHub Security Advisories
- Email (see SECURITY.md)

**Do not** open public issues for security vulnerabilities.

### What about API keys?

- Never commit API keys to Git
- Use `.mcp.json` (which is in `.gitignore`)
- Use environment variables for production
- Rotate keys regularly

---

## 🤝 Contributing

### How can I contribute?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

### What kind of contributions are welcome?

- Bug fixes
- New features
- Documentation improvements
- Test improvements
- Performance optimizations
- Examples and tutorials

### Do I need to sign a CLA?

No, there's no Contributor License Agreement. By contributing, you agree to license your contributions under the MIT License.

---

## 📦 Deployment

### Can I deploy this to production?

Yes! The project is production-ready. Make sure to:
- Run all tests
- Configure properly
- Use environment variables for secrets
- Monitor performance
- Keep dependencies updated

### How do I publish to npm?

The project is ready for npm publishing:

```bash
npm login
npm publish
```

Make sure to update the package name in `package.json` if needed.

### Can I use it in a Docker container?

Yes! Create a `Dockerfile`:

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "src/index.js"]
```

---

## 📞 Support

### Where can I get help?

- 📖 [Documentation](./docs/)
- 💬 [GitHub Discussions](https://github.com/liangjie559567/axiom-omc-integration/discussions)
- 🐛 [Report Issues](https://github.com/liangjie559567/axiom-omc-integration/issues)

### How do I report bugs?

Use the bug report template on GitHub:
https://github.com/liangjie559567/axiom-omc-integration/issues/new/choose

### Can I request features?

Yes! Use the feature request template:
https://github.com/liangjie559567/axiom-omc-integration/issues/new/choose

---

## 📚 Resources

### Where can I learn more?

- [Quick Start Guide](./QUICKSTART.md)
- [User Guide](./docs/USER-GUIDE.md)
- [API Reference](./docs/API-REFERENCE.md)
- [Examples](./examples/)

### Are there video tutorials?

Not yet, but we welcome community contributions! If you create tutorials, let us know and we'll link to them.

### Is there a community?

Join the discussion on GitHub:
https://github.com/liangjie559567/axiom-omc-integration/discussions

---

## 🎉 Still have questions?

Feel free to:
- Open a discussion on GitHub
- Check the documentation
- Look at the examples
- Ask in the community

**We're here to help!** 🚀
