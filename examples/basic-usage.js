/**
 * Basic Usage Examples
 *
 * This file demonstrates basic usage of the Axiom-OMC Integration system.
 */

import { createAgentSystem } from '../src/agents/agent-system.js';
import { createMemorySystem } from '../src/core/memory-system.js';
import { createWorkflowIntegration } from '../src/core/workflow-integration.js';
import { createCommandRouter } from '../src/core/command-router.js';

// ============================================================================
// Example 1: Using the Agent System
// ============================================================================

async function example1_AgentSystem() {
  console.log('\n=== Example 1: Agent System ===\n');

  // Create agent system
  const agentSystem = createAgentSystem();

  // List all available agents
  const agents = agentSystem.listAgents();
  console.log(`Available agents: ${agents.length}`);
  console.log('First 5 agents:', agents.slice(0, 5).map(a => a.id));

  // Get agent information
  const architect = agentSystem.getAgent('architect');
  console.log('\nArchitect agent:', {
    id: architect.id,
    name: architect.name,
    lane: architect.lane
  });

  // Execute an agent
  console.log('\nExecuting architect agent...');
  const result = await agentSystem.execute('architect', {
    task: 'Design a simple REST API',
    requirements: ['RESTful', 'JSON', 'Authentication']
  });

  console.log('Execution result:', {
    executionId: result.executionId,
    status: result.status,
    duration: result.duration
  });
}

// ============================================================================
// Example 2: Using the Memory System
// ============================================================================

async function example2_MemorySystem() {
  console.log('\n=== Example 2: Memory System ===\n');

  // Create and initialize memory system
  const memorySystem = createMemorySystem({
    storageDir: '.omc/memory-examples'
  });
  await memorySystem.initialize();

  // Add a decision
  console.log('Adding a decision...');
  const decision = await memorySystem.addDecision({
    title: 'Use PostgreSQL for database',
    description: 'Decided to use PostgreSQL instead of MongoDB',
    rationale: 'Need ACID compliance and complex queries',
    tags: ['database', 'architecture'],
    impact: 'high'
  });
  console.log('Decision added:', decision.id);

  // Add knowledge to the graph
  console.log('\nAdding knowledge nodes...');
  await memorySystem.addKnowledge({
    type: 'technology',
    name: 'PostgreSQL',
    description: 'Open-source relational database',
    tags: ['database', 'sql']
  });

  await memorySystem.addKnowledge({
    type: 'technology',
    name: 'Node.js',
    description: 'JavaScript runtime',
    tags: ['backend', 'javascript']
  });

  // Create a relationship
  await memorySystem.addRelationship('Node.js', 'PostgreSQL', 'uses');
  console.log('Relationship created: Node.js -> uses -> PostgreSQL');

  // Search knowledge
  console.log('\nSearching for "database"...');
  const results = await memorySystem.searchKnowledge('database');
  console.log(`Found ${results.length} results`);

  // Get statistics
  const stats = await memorySystem.getStats();
  console.log('\nMemory statistics:', stats);
}

// ============================================================================
// Example 3: Using Workflows
// ============================================================================

async function example3_Workflows() {
  console.log('\n=== Example 3: Workflows ===\n');

  // Create workflow integration
  const workflow = createWorkflowIntegration();

  // List available workflows
  const workflows = workflow.listWorkflows();
  console.log('Available workflows:', workflows.map(w => w.id));

  // Start a workflow
  console.log('\nStarting OMC workflow...');
  const instance = await workflow.startWorkflow('omc-default', {
    projectName: 'Example Project',
    description: 'A sample project for demonstration'
  });

  console.log('Workflow started:', {
    instanceId: instance.id,
    workflowId: instance.workflowId,
    currentPhase: instance.currentPhase
  });

  // Get workflow status
  const status = await workflow.getWorkflowStatus(instance.id);
  console.log('\nWorkflow status:', {
    phase: status.currentPhase,
    progress: status.progress,
    canTransition: status.canTransition
  });

  // Transition to next phase
  console.log('\nTransitioning to next phase...');
  await workflow.transitionPhase(instance.id, 'design');

  const newStatus = await workflow.getWorkflowStatus(instance.id);
  console.log('New phase:', newStatus.currentPhase);

  // List active workflows
  const activeWorkflows = await workflow.getActiveWorkflows();
  console.log(`\nActive workflows: ${activeWorkflows.length}`);
}

// ============================================================================
// Example 4: Using Command Router
// ============================================================================

async function example4_CommandRouter() {
  console.log('\n=== Example 4: Command Router ===\n');

  // Create command router
  const router = createCommandRouter();

  // Register a custom command
  console.log('Registering custom command...');
  router.register('hello', async (args) => {
    return {
      success: true,
      message: `Hello, ${args.name || 'World'}!`
    };
  }, {
    description: 'Say hello',
    parameters: {
      name: { type: 'string', optional: true }
    }
  });

  // Execute the command
  console.log('\nExecuting command...');
  const result = await router.execute('hello', { name: 'Axiom-OMC' });
  console.log('Result:', result);

  // List all commands
  const commands = router.listCommands();
  console.log(`\nTotal commands: ${commands.length}`);
  console.log('Sample commands:', commands.slice(0, 5).map(c => c.name));

  // Get command info
  const commandInfo = router.getCommand('hello');
  console.log('\nCommand info:', {
    name: commandInfo.name,
    description: commandInfo.description
  });
}

// ============================================================================
// Example 5: Complete Integration
// ============================================================================

async function example5_CompleteIntegration() {
  console.log('\n=== Example 5: Complete Integration ===\n');

  // Initialize all systems
  const agentSystem = createAgentSystem();
  const memorySystem = createMemorySystem({
    storageDir: '.omc/memory-examples'
  });
  await memorySystem.initialize();
  const workflow = createWorkflowIntegration();

  // Start a workflow
  console.log('Starting workflow...');
  const instance = await workflow.startWorkflow('omc-default', {
    projectName: 'Integrated Example'
  });

  // Execute an agent
  console.log('\nExecuting architect agent...');
  const agentResult = await agentSystem.execute('architect', {
    task: 'Design system architecture',
    context: { workflowId: instance.id }
  });

  // Record the decision in memory
  console.log('\nRecording decision...');
  await memorySystem.addDecision({
    title: 'Architecture Design Completed',
    description: `Agent ${agentResult.agentId} completed architecture design`,
    rationale: 'Part of workflow execution',
    tags: ['workflow', 'architecture'],
    metadata: {
      workflowId: instance.id,
      executionId: agentResult.executionId
    }
  });

  // Transition workflow
  console.log('\nTransitioning workflow...');
  await workflow.transitionPhase(instance.id, 'design');

  // Get final status
  const finalStatus = await workflow.getWorkflowStatus(instance.id);
  const stats = await memorySystem.getStats();

  console.log('\nFinal state:', {
    workflow: {
      phase: finalStatus.currentPhase,
      progress: finalStatus.progress
    },
    memory: {
      decisions: stats.decisions,
      knowledge: stats.knowledge
    }
  });
}

// ============================================================================
// Run All Examples
// ============================================================================

async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Axiom-OMC Integration - Basic Usage Examples          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await example1_AgentSystem();
    await example2_MemorySystem();
    await example3_Workflows();
    await example4_CommandRouter();
    await example5_CompleteIntegration();

    console.log('\n✅ All examples completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

// Export for use in other files
export {
  example1_AgentSystem,
  example2_MemorySystem,
  example3_Workflows,
  example4_CommandRouter,
  example5_CompleteIntegration
};
