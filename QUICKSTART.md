# Quick Start Guide

Get started with Axiom-OMC Integration in 5 minutes! 🚀

---

## 📦 Installation

### Option 1: Clone from GitHub

```bash
# Clone the repository
git clone https://github.com/liangjie559567/axiom-omc-integration.git
cd axiom-omc-integration

# Install dependencies
npm install

# Verify installation
npm test
```

### Option 2: As Claude Code Plugin

```bash
# Clone to Claude Code plugins directory
git clone https://github.com/liangjie559567/axiom-omc-integration.git \
  ~/.claude/plugins/axiom-omc

# Activate in Claude Code
/plugin activate axiom-omc
```

---

## 🎯 First Steps

### 1. List Available Agents

```bash
# Using CLI
node src/cli/index.js agent:list

# Or in Claude Code
/agent list
```

**Output:**
```
Available Agents (32):

Architect Lane:
  - architect: System architecture design
  - tech-lead: Technical leadership
  - api-designer: API design
  - database-architect: Database architecture

Executor Lane:
  - frontend-dev: Frontend development
  - backend-dev: Backend development
  ...
```

### 2. Execute an Agent

```bash
# Execute the architect agent
node src/cli/index.js agent:execute architect '{"task": "Design a REST API"}'

# Or in Claude Code
/agent execute architect {"task": "Design a REST API"}
```

### 3. Start a Workflow

```bash
# Start the OMC default workflow
node src/cli/index.js workflow:start omc-default

# Or in Claude Code
/workflow start omc-default
```

---

## 💡 Common Use Cases

### Use Case 1: Code Review

```javascript
import { createAgentSystem } from './src/agents/agent-system.js';

const agentSystem = createAgentSystem();

// Execute code review
const result = await agentSystem.execute('code-reviewer', {
  code: 'function add(a, b) { return a + b; }',
  language: 'javascript'
});

console.log(result);
```

### Use Case 2: Memory Management

```javascript
import { createMemorySystem } from './src/core/memory-system.js';

const memorySystem = createMemorySystem();
await memorySystem.initialize();

// Add a decision
await memorySystem.addDecision({
  title: 'Use TypeScript',
  description: 'Decided to use TypeScript for better type safety',
  rationale: 'Team consensus, better tooling support',
  tags: ['architecture', 'language']
});

// Search knowledge
const results = await memorySystem.searchKnowledge('TypeScript');
console.log(results);
```

### Use Case 3: Workflow Integration

```javascript
import { createWorkflowIntegration } from './src/core/workflow-integration.js';

const workflow = createWorkflowIntegration();

// Start a workflow
const instance = await workflow.startWorkflow('omc-default', {
  projectName: 'My Project'
});

// Transition to next phase
await workflow.transitionPhase(instance.id, 'design');

// Check status
const status = await workflow.getWorkflowStatus(instance.id);
console.log(status);
```

---

## 🔧 Configuration

### Basic Configuration

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

### MCP Configuration

Copy and configure MCP settings:

```bash
cp .mcp.json.example .mcp.json
# Edit .mcp.json with your API keys
```

See [MCP-SETUP.md](./MCP-SETUP.md) for detailed instructions.

---

## 📚 Next Steps

### Learn More

- 📖 [User Guide](./docs/USER-GUIDE.md) - Comprehensive usage guide
- 📘 [API Reference](./docs/API-REFERENCE.md) - Complete API documentation
- 📗 [Plugin Documentation](./PLUGIN.md) - Claude Code plugin guide

### Explore Examples

- [examples/basic-usage.js](./examples/basic-usage.js) - Basic usage examples
- [examples/advanced-workflows.js](./examples/advanced-workflows.js) - Advanced workflows
- [examples/custom-agents.js](./examples/custom-agents.js) - Creating custom agents

### Get Help

- 💬 [GitHub Discussions](https://github.com/liangjie559567/axiom-omc-integration/discussions)
- 🐛 [Report Issues](https://github.com/liangjie559567/axiom-omc-integration/issues)
- 📧 Contact maintainers

---

## 🎓 Tutorials

### Tutorial 1: Your First Agent

```javascript
// 1. Import the agent system
import { createAgentSystem } from './src/agents/agent-system.js';

// 2. Create an instance
const agentSystem = createAgentSystem();

// 3. Execute an agent
const result = await agentSystem.execute('architect', {
  task: 'Design a microservices architecture',
  requirements: ['scalability', 'resilience']
});

// 4. Check the result
console.log('Agent Result:', result);
```

### Tutorial 2: Building a Workflow

```javascript
// 1. Import workflow integration
import { createWorkflowIntegration } from './src/core/workflow-integration.js';

// 2. Create workflow instance
const workflow = createWorkflowIntegration();

// 3. Start workflow
const instance = await workflow.startWorkflow('omc-default', {
  projectName: 'My App',
  description: 'Building a web application'
});

// 4. Progress through phases
await workflow.transitionPhase(instance.id, 'design');
await workflow.transitionPhase(instance.id, 'implementation');

// 5. Check progress
const status = await workflow.getWorkflowStatus(instance.id);
console.log('Workflow Status:', status);
```

### Tutorial 3: Using Memory System

```javascript
// 1. Import memory system
import { createMemorySystem } from './src/core/memory-system.js';

// 2. Initialize
const memory = createMemorySystem();
await memory.initialize();

// 3. Add knowledge
await memory.addKnowledge({
  type: 'concept',
  name: 'REST API',
  description: 'Representational State Transfer API',
  tags: ['api', 'architecture']
});

// 4. Create relationships
await memory.addRelationship('REST API', 'HTTP', 'uses');

// 5. Query knowledge
const results = await memory.searchKnowledge('API');
console.log('Knowledge Results:', results);
```

---

## 🚀 Performance Tips

### 1. Parallel Agent Execution

```javascript
// Execute multiple agents in parallel
const results = await Promise.all([
  agentSystem.execute('frontend-dev', { task: 'Build UI' }),
  agentSystem.execute('backend-dev', { task: 'Build API' }),
  agentSystem.execute('database-architect', { task: 'Design schema' })
]);
```

### 2. Efficient Memory Queries

```javascript
// Use specific queries instead of broad searches
const results = await memory.searchKnowledge('REST API', {
  limit: 10,
  tags: ['architecture']
});
```

### 3. Workflow Optimization

```javascript
// Enable auto-transition for faster workflows
const workflow = createWorkflowIntegration({
  enableAutoTransition: true
});
```

---

## 🔍 Troubleshooting

### Issue: Agent execution fails

**Solution:**
```bash
# Check agent configuration
node src/cli/index.js agent:info <agentId>

# Verify agent exists
node src/cli/index.js agent:list
```

### Issue: Memory system not persisting

**Solution:**
```javascript
// Ensure storage directory exists
import { mkdir } from 'fs/promises';
await mkdir('.omc/memory', { recursive: true });

// Initialize memory system
await memory.initialize();
```

### Issue: Workflow stuck

**Solution:**
```bash
# Check workflow status
node src/cli/index.js workflow:status <instanceId>

# Force transition if needed
node src/cli/index.js workflow:goto <instanceId> <phase>
```

---

## 📊 Monitoring

### Check System Status

```bash
# View all active workflows
node src/cli/index.js workflow:active

# View agent execution history
node src/cli/index.js agent:history

# View memory statistics
node src/cli/index.js memory:stats
```

---

## 🎉 You're Ready!

You now have everything you need to start using Axiom-OMC Integration!

### Quick Links

- 📖 [Full Documentation](./docs/)
- 💡 [Examples](./examples/)
- 🐛 [Report Issues](https://github.com/liangjie559567/axiom-omc-integration/issues)
- 💬 [Ask Questions](https://github.com/liangjie559567/axiom-omc-integration/discussions)

**Happy coding!** 🚀
