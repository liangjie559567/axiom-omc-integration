import ExecutionMode from './ExecutionMode.js';

class AutopilotMode extends ExecutionMode {
  constructor() {
    super('autopilot');
  }

  async execute(task) {
    await this.start();
    return { task, status: 'completed' };
  }
}

export default AutopilotMode;
