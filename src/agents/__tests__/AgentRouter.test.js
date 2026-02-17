import AgentRouter from '../AgentRouter.js';

describe('AgentRouter', () => {
  let router;

  beforeEach(() => {
    router = new AgentRouter();
  });

  test('应正确获取Agent', () => {
    const agent = router.getAgent('executor');
    expect(agent.name).toBe('executor');
  });

  test('应根据任务类型选择Agent', () => {
    const agent = router.selectAgent('implementation');
    expect(agent.name).toBe('executor');
  });

  test('应列出所有Agent', () => {
    const agents = router.listAgents();
    expect(agents.length).toBe(32);
  });
});
