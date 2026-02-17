# Contributing to Axiom-OMC Integration

Thank you for your interest in contributing to the Axiom-OMC Integration project! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## 📜 Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please be respectful and constructive in all interactions.

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/axiom-omc-integration.git
   cd axiom-omc-integration
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/liangjie559567/axiom-omc-integration.git
   ```

---

## 💻 Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run tests to ensure everything works:
   ```bash
   npm test
   ```

3. Create a new branch for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## 🤝 How to Contribute

### Types of Contributions

- 🐛 **Bug fixes** - Fix issues and improve stability
- ✨ **New features** - Add new agents, commands, or functionality
- 🎯 **Skills** - Create new Superpowers skills
- 🪝 **Hooks** - Add new hook integrations
- ⚡ **Commands** - Develop new commands
- 📚 **Documentation** - Improve docs, add examples, fix typos
- 🧪 **Tests** - Add or improve test coverage
- ⚡ **Performance** - Optimize code for better performance
- 🎨 **Code quality** - Refactoring, cleanup, better patterns

### Contribution Workflow

1. **Check existing issues** - See if your idea/bug is already reported
2. **Create an issue** - Discuss your proposal before starting work
3. **Get feedback** - Wait for maintainer feedback on your proposal
4. **Start coding** - Once approved, start working on your branch
5. **Write tests** - Ensure your changes are well-tested
6. **Submit PR** - Create a pull request with clear description

---

## 🎯 Contributing to Superpowers Integration

### Creating New Skills

Skills are workflow guides that help developers follow best practices.

**Location**: `skills/your-skill-name/`

**Structure**:
```
skills/your-skill-name/
├── skill.md          # Skill content (required)
└── README.md         # Skill description (optional)
```

**Template**:
```markdown
# Your Skill Name

Brief description of what this skill helps with.

## When to Use

- Situation 1
- Situation 2

## Workflow

### Phase 1: Preparation

Steps for preparation...

### Phase 2: Execution

Steps for execution...

### Phase 3: Verification

Steps for verification...

## Best Practices

- Practice 1
- Practice 2

## Common Pitfalls

- Pitfall 1 and how to avoid it
- Pitfall 2 and how to avoid it
```

**Example**: See `skills/brainstorming/skill.md`

### Creating New Commands

Commands extend the command system with new functionality.

**Location**: `commands/group-name/command-name.js`

**Template**:
```javascript
/**
 * command-name 命令 - Brief description
 */

export default {
  name: 'command-name',
  description: 'Command description',
  aliases: ['alias1', 'alias2'],
  group: 'group-name',
  options: {
    usage: 'command-name [options]',
    examples: [
      'command-name',
      'command-name --flag'
    ]
  },

  async execute(parsed, context) {
    // Access parsed arguments
    const arg = parsed.args[0];
    const flag = parsed.flags.flag;

    // Access context
    const { commandSystem, hookSystem } = context;

    // Implement command logic
    try {
      // Your logic here
      return 'Success message';
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
};
```

**Testing**:
```javascript
// Add to test-commands.js
console.log('测试: 执行 command-name');
const result = await commandSystem.executeCommand('command-name arg1 --flag');
console.log(result.success ? '✅ 成功' : '❌ 失败');
```

**Example**: See `commands/core/help.js`

### Adding New Hooks

Hooks enable event-driven automation.

**Configuration**: `hooks/hooks.json`

**Command Hook Template**:
```json
{
  "event": "YourEvent",
  "type": "command",
  "command": "echo 'Event triggered: ${eventData}'",
  "async": true,
  "condition": {
    "type": "regex",
    "pattern": "pattern-to-match"
  }
}
```

**Function Hook Template**:
```javascript
import { hookSystem } from './src/core/HookSystem.js';

hookSystem.registerFunctionHook('YourEvent', async (context) => {
  // Access context data
  const { event, data } = context;

  // Implement hook logic
  console.log(`Event: ${event}`);

  // Perform actions
  await doSomething(data);
});
```

**Triggering Hooks**:
```javascript
// In your code
await hookSystem.executeHooks('YourEvent', {
  data: { key: 'value' }
});
```

**Example**: See `hooks/hooks.json` and `test-hooks.js`

### Priority Areas

**High Priority**:
1. New commands (`config`, `plugin`, `agent`)
2. Documentation improvements
3. More hook integration points

**Medium Priority**:
4. New skills for specific workflows
5. Command system enhancements
6. Performance optimizations

**Low Priority**:
7. Web interface
8. API services
9. Advanced features

---

## 📝 Coding Standards

### JavaScript Style

- Use ES6+ features
- Use `const` and `let`, avoid `var`
- Use arrow functions where appropriate
- Use template literals for strings
- Use async/await instead of callbacks

### Code Organization

- Keep files focused and single-purpose
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and testable

### Example

```javascript
/**
 * Execute an agent with the given input
 * @param {string} agentId - The agent identifier
 * @param {Object} input - Input data for the agent
 * @returns {Promise<Object>} Execution result
 */
async function executeAgent(agentId, input) {
  const agent = await registry.get(agentId);
  return await executor.execute(agent, input);
}
```

---

## 🧪 Testing Guidelines

### Test Requirements

- All new features must include tests
- Bug fixes should include regression tests
- Maintain or improve code coverage (target: >90%)

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Run Superpowers integration tests
node test-hooks.js      # Hook system tests
node test-commands.js   # Command system tests
node test-plugin-manual.js  # Plugin tests
```

### Writing Tests

```javascript
import { describe, test, expect } from '@jest/globals';
import { createAgent } from '../src/agents/agent-system.js';

describe('Agent System', () => {
  test('should create agent successfully', () => {
    const agent = createAgent({ id: 'test', name: 'Test Agent' });
    expect(agent.id).toBe('test');
    expect(agent.name).toBe('Test Agent');
  });
});
```

---

## 🔄 Pull Request Process

### Before Submitting

1. ✅ All tests pass (`npm test`)
2. ✅ Code follows style guidelines
3. ✅ Documentation is updated
4. ✅ Commit messages are clear
5. ✅ Branch is up to date with main

### PR Title Format

Use conventional commit format:

- `feat: Add new agent for code review`
- `fix: Resolve memory leak in workflow engine`
- `docs: Update API reference for memory system`
- `test: Add integration tests for CLI commands`
- `perf: Optimize agent execution performance`
- `refactor: Simplify command router logic`

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests passing

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, your PR will be merged
4. Your contribution will be credited in release notes

---

## 🐛 Reporting Bugs

### Before Reporting

1. Check if the bug is already reported
2. Verify it's reproducible in the latest version
3. Collect relevant information

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Step one
2. Step two
3. Step three

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., Windows 11, macOS 14]
- Node.js version: [e.g., 18.17.0]
- Package version: [e.g., 2.1.0]

**Additional Context**
Any other relevant information
```

---

## 💡 Suggesting Features

### Feature Request Template

```markdown
**Feature Description**
Clear description of the proposed feature

**Use Case**
Why is this feature needed? What problem does it solve?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
What other approaches did you consider?

**Additional Context**
Any mockups, examples, or references
```

---

## 📞 Getting Help

- 💬 **Discussions** - Ask questions in GitHub Discussions
- 🐛 **Issues** - Report bugs or request features
- 📧 **Email** - Contact maintainers directly (for sensitive issues)

---

## 🎓 Resources

### Core Documentation
- [Project Documentation](./docs/)
- [API Reference](./docs/API-REFERENCE.md)
- [User Guide](./docs/USER-GUIDE.md)
- [Architecture Overview](./docs/architecture.md)

### Superpowers Integration
- [Quick Start Guide](./QUICK-START.md) - 5-minute introduction
- [Final Integration Summary](./FINAL-INTEGRATION-SUMMARY.md) - Complete overview
- [Roadmap](./ROADMAP.md) - Future development plans
- [Hook System Guide](./docs/HookSystem.md) - Detailed hook documentation
- [Plan C Report](./PLAN-C-INTEGRATION-COMPLETE.md) - Command system details
- [Plan B Report](./PLAN-B-INTEGRATION-COMPLETE.md) - Hook system details
- [100% Integration Report](./SUPERPOWERS-100-PERCENT-INTEGRATION.md) - Skills details

---

## 🙏 Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort! ❤️

---

**Happy Contributing!** 🎉
