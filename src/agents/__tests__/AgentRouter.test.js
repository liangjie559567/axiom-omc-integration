import AgentRouter from '../AgentRouter.js';

describe('AgentRouter', () => {
  let router;

  beforeEach(() => {
    router = new AgentRouter();
  });

  test('应注册和路由任务', () => {
    router.register('implementation', 'executor');
    expect(router.route('implementation')).toBe('executor');
  });

  test('应列出所有路由', () => {
    router.register('implementation', 'executor');
    router.register('verification', 'verifier');
    const routes = router.list();
    expect(routes.length).toBe(2);
  });
});
