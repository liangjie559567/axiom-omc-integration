# Examples

This directory contains practical examples demonstrating how to use the Axiom-OMC Integration system.

---

## 📚 Available Examples

### 1. Basic Usage (`basic-usage.js`)

Demonstrates fundamental usage of all core systems:
- Agent system execution
- Memory system operations
- Workflow management
- Command routing
- Complete integration

**Run it:**
```bash
node examples/basic-usage.js
```

---

## 🚀 Running Examples

### Prerequisites

Make sure you have installed dependencies:
```bash
npm install
```

### Run Individual Examples

```bash
# Run basic usage examples
node examples/basic-usage.js
```

---

## 📖 Example Structure

Each example file includes:
- Clear comments explaining each step
- Error handling
- Console output for visibility
- Reusable functions you can import

---

## 💡 Learning Path

We recommend following this order:

1. **basic-usage.js** - Start here to understand the basics
2. Explore the [User Guide](../docs/USER-GUIDE.md) for detailed explanations
3. Check the [API Reference](../docs/API-REFERENCE.md) for complete API documentation

---

## 🎯 Common Patterns

### Pattern 1: Initialize Systems

```javascript
import { createAgentSystem } from '../src/agents/agent-system.js';
import { createMemorySystem } from '../src/core/memory-system.js';

const agentSystem = createAgentSystem();
const memorySystem = createMemorySystem();
await memorySystem.initialize();
```

### Pattern 2: Execute Agent

```javascript
const result = await agentSystem.execute('architect', {
  task: 'Your task here',
  requirements: ['requirement1', 'requirement2']
});
```

### Pattern 3: Manage Workflows

```javascript
import { createWorkflowIntegration } from '../src/core/workflow-integration.js';

const workflow = createWorkflowIntegration();
const instance = await workflow.startWorkflow('omc-default', {
  projectName: 'My Project'
});
```

### Pattern 4: Use Memory

```javascript
// Add decision
await memorySystem.addDecision({
  title: 'Decision title',
  description: 'Description',
  rationale: 'Why this decision',
  tags: ['tag1', 'tag2']
});

// Search knowledge
const results = await memorySystem.searchKnowledge('query');
```

---

## 🔧 Customization

You can modify these examples to fit your needs:

1. **Change configuration:**
   ```javascript
   const agentSystem = createAgentSystem({
     maxConcurrent: 10,
     timeout: 600000
   });
   ```

2. **Add custom agents:**
   ```javascript
   agentSystem.registerAgent({
     id: 'my-agent',
     name: 'My Custom Agent',
     // ... agent definition
   });
   ```

3. **Create custom workflows:**
   ```javascript
   workflow.registerWorkflow({
     id: 'my-workflow',
     name: 'My Custom Workflow',
     phases: [/* ... */]
   });
   ```

---

## 🐛 Troubleshooting

### Issue: Module not found

**Solution:**
```bash
# Make sure you're in the project root
cd axiom-omc-integration

# Install dependencies
npm install
```

### Issue: Permission denied

**Solution:**
```bash
# On Unix/Linux/Mac
chmod +x examples/*.js

# Or run with node explicitly
node examples/basic-usage.js
```

### Issue: Memory directory not found

**Solution:**
The examples will create the `.omc/memory-examples` directory automatically. If you encounter issues:
```bash
mkdir -p .omc/memory-examples
```

---

## 📞 Need Help?

- 📖 [User Guide](../docs/USER-GUIDE.md)
- 📘 [API Reference](../docs/API-REFERENCE.md)
- 💬 [GitHub Discussions](https://github.com/liangjie559567/axiom-omc-integration/discussions)
- 🐛 [Report Issues](https://github.com/liangjie559567/axiom-omc-integration/issues)

---

## 🎉 Contributing Examples

Have a great example to share? We'd love to include it!

1. Create your example file
2. Add clear comments
3. Test it thoroughly
4. Submit a pull request

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

**Happy learning!** 🚀
