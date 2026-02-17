import ExecutionMode from '../ExecutionMode.js';

describe('ExecutionMode', () => {
  let mode;

  beforeEach(() => {
    mode = new ExecutionMode('test');
  });

  test('应正确初始化', () => {
    expect(mode.name).toBe('test');
    expect(mode.state).toBe('idle');
  });

  test('应正确启动', async () => {
    await mode.start();
    expect(mode.state).toBe('running');
  });

  test('应正确停止', async () => {
    await mode.stop();
    expect(mode.state).toBe('stopped');
  });
});
