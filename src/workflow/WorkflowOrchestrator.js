class WorkflowOrchestrator {
  constructor() {
    this.workflows = new Map();
  }

  register(id, steps) {
    this.workflows.set(id, { steps, current: 0 });
  }

  async execute(id) {
    const workflow = this.workflows.get(id);
    if (!workflow) return null;
    const step = workflow.steps[workflow.current];
    workflow.current++;
    return step;
  }

  getStatus(id) {
    const workflow = this.workflows.get(id);
    return workflow ? { current: workflow.current, total: workflow.steps.length } : null;
  }
}

export default WorkflowOrchestrator;
