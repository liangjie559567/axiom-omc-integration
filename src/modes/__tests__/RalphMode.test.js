import RalphMode from '../RalphMode.js';

describe('RalphMode', () => {
  let mode;

  beforeEach(() => {
    mode = new RalphMode();
  });

  test('应正确初始化为ralph', () => {
    expect(mode.name).toBe('ralph');
    expect(mode.persistent).toBe(true);
  });

  test('应正确执行持久化循环', async () => {
    const result = await mode.loop('test-task');
    expect(result.persistent).toBe(true);
    expect(mode.state).toBe('running');
  });
});
