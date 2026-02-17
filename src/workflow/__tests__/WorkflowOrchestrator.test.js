import WorkflowOrchestrator from '../WorkflowOrchestrator.js';

describe('WorkflowOrchestrator', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new WorkflowOrchestrator();
  });

  test('应注册和执行工作流', async () => {
    orchestrator.register('wf1', ['step1', 'step2']);
    expect(await orchestrator.execute('wf1')).toBe('step1');
    expect(await orchestrator.execute('wf1')).toBe('step2');
  });

  test('应跟踪工作流状态', () => {
    orchestrator.register('wf1', ['a', 'b', 'c']);
    expect(orchestrator.getStatus('wf1')).toEqual({ current: 0, total: 3 });
  });
});
