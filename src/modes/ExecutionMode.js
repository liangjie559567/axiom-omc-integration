class ExecutionMode {
  constructor(name) {
    this.name = name;
    this.state = 'idle';
  }

  async start() {
    this.state = 'running';
  }

  async stop() {
    this.state = 'stopped';
  }
}

export default ExecutionMode;
