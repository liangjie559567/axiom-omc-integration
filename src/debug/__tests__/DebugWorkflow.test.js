import DebugWorkflow from '../DebugWorkflow.js';

describe('DebugWorkflow', () => {
  let workflow;

  beforeEach(() => {
    workflow = new DebugWorkflow();
  });

  test('应启动调试流程', () => {
    expect(workflow.start()).toBe('observe');
  });

  test('应切换到下一阶段', () => {
    workflow.start();
    expect(workflow.next()).toBe('hypothesize');
  });
});
