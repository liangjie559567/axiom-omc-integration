class AgentCommunicator {
  constructor() {
    this.messages = [];
  }

  send(from, to, message) {
    const msg = { from, to, message, timestamp: Date.now() };
    this.messages.push(msg);
    return msg;
  }

  getMessages(agentId) {
    return this.messages.filter(m => m.to === agentId);
  }

  clear() {
    this.messages = [];
  }
}

export default AgentCommunicator;
