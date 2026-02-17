import ExecutionMode from './ExecutionMode.js';

class RalphMode extends ExecutionMode {
  constructor() {
    super('ralph');
    this.persistent = true;
  }

  async loop(task) {
    await this.start();
    return { task, persistent: this.persistent };
  }
}

export default RalphMode;
