import TeamOrchestrationEngine from '../TeamOrchestrationEngine.js';

describe('TeamOrchestrationEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new TeamOrchestrationEngine();
  });

  test('应启动管道', () => {
    expect(engine.start()).toBe('team-plan');
    expect(engine.getCurrentStage()).toBe('team-plan');
  });

  test('应转换阶段', () => {
    engine.start();
    expect(engine.transition('team-prd')).toBe(true);
    expect(engine.getCurrentStage()).toBe('team-prd');
  });

  test('应拒绝无效阶段', () => {
    engine.start();
    expect(engine.transition('invalid')).toBe(false);
  });
});
