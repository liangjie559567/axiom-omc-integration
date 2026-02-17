import TeamPipeline from '../TeamPipeline.js';

describe('TeamPipeline', () => {
  let pipeline;

  beforeEach(() => {
    pipeline = new TeamPipeline();
  });

  test('应正确初始化阶段', () => {
    expect(pipeline.stages.length).toBe(5);
    expect(pipeline.currentStage).toBe('team-plan');
  });

  test('应正确获取阶段Agent', () => {
    const agents = pipeline.getStageAgents('team-plan');
    expect(agents).toContain('explore');
  });

  test('应正确转换阶段', async () => {
    const result = await pipeline.transitionTo('team-prd');
    expect(result).toBe(true);
    expect(pipeline.currentStage).toBe('team-prd');
  });
});
