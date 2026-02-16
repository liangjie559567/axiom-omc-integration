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

- [Project Documentation](./docs/)
- [API Reference](./docs/API-REFERENCE.md)
- [User Guide](./docs/USER-GUIDE.md)
- [Architecture Overview](./docs/architecture.md)

---

## 🙏 Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort! ❤️

---

**Happy Contributing!** 🎉
