import AgentRouter from '../AgentRouter.js';

describe('AgentRouter', () => {
  let router;

  beforeEach(() => {
    router = new AgentRouter();
  });

  test('应正确路由到指定agent', () => {
    const agent = router.route('executor');
    expect(agent.name).toBe('executor');
    expect(agent.model).toBe('sonnet');
  });

  test('不存在的agent应返回null', () => {
    const agent = router.route('non-existent');
    expect(agent).toBeNull();
  });

  test('应正确获取agent列表', () => {
    const agents = router.listAgents();
    expect(agents).toContain('executor');
    expect(agents).toContain('planner');
    expect(agents.length).toBeGreaterThan(0);
  });
});
