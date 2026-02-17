import agentDefinitions from './AgentDefinitions.js';

class AgentRouter {
  constructor() {
    this.agents = agentDefinitions;
  }

  route(taskType) {
    return this.agents[taskType] || null;
  }

  getAgent(name) {
    return this.agents[name] || null;
  }

  listAgents() {
    return Object.keys(this.agents);
  }
}

export default AgentRouter;
