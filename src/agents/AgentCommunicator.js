class AgentCommunicator {
  constructor() {
    this.messages = [];
  }

  send(from, to, message) {
    this.messages.push({ from, to, message, timestamp: Date.now() });
  }

  receive(agentId) {
    return this.messages.filter(m => m.to === agentId);
  }
}

export default AgentCommunicator;
