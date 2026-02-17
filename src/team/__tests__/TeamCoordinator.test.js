import TeamCoordinator from '../TeamCoordinator.js';

describe('TeamCoordinator', () => {
  let coordinator;

  beforeEach(() => {
    coordinator = new TeamCoordinator();
  });

  test('应正确添加agent到团队', () => {
    const agent = coordinator.addAgent('executor');
    expect(agent).toBeDefined();
    expect(coordinator.getTeam()).toHaveLength(1);
  });

  test('应返回完整团队列表', () => {
    coordinator.addAgent('executor');
    coordinator.addAgent('planner');
    expect(coordinator.getTeam()).toHaveLength(2);
  });
});
