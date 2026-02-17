import AutopilotMode from '../AutopilotMode.js';

describe('AutopilotMode', () => {
  let mode;

  beforeEach(() => {
    mode = new AutopilotMode();
  });

  test('应正确初始化为autopilot', () => {
    expect(mode.name).toBe('autopilot');
  });

  test('应正确执行任务', async () => {
    const result = await mode.execute('test-task');
    expect(result.status).toBe('completed');
    expect(mode.state).toBe('running');
  });
});
