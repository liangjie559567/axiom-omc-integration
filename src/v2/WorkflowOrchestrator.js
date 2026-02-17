/**
 * WorkflowOrchestrator v2 - CQRS版本
 */
export class WorkflowOrchestrator {
  constructor(commandHandler, queryHandler) {
    this.commandHandler = commandHandler;
    this.queryHandler = queryHandler;
  }

  async startWorkflow(workflowId, context) {
    return await this.commandHandler.execute({
      type: 'START_WORKFLOW',
      instanceId: `${workflowId}-${Date.now()}`,
      data: context
    });
  }

  getWorkflowState(instanceId) {
    return this.queryHandler.getState(instanceId);
  }
}
