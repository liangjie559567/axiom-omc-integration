class AgentRouter {
  constructor() {
    this.routes = new Map();
  }

  register(taskType, agentId) {
    this.routes.set(taskType, agentId);
  }

  route(taskType) {
    return this.routes.get(taskType);
  }

  list() {
    return Array.from(this.routes.entries());
  }
}

export default AgentRouter;
