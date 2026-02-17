import agentDefinitions from './AgentDefinitions.js';

class AgentRouter {
  constructor() {
    this.agents = agentDefinitions;
  }

  getAgent(name) {
    return this.agents[name];
  }

  selectAgent(taskType) {
    const typeMap = {
      implementation: 'executor',
      verification: 'verifier',
      debugging: 'debugger',
      planning: 'planner',
      analysis: 'analyst'
    };
    return this.agents[typeMap[taskType]];
  }

  listAgents() {
    return Object.keys(this.agents);
  }
}

export default AgentRouter;
