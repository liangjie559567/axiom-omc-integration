import Scheduler from '../Scheduler.js';

describe('Scheduler', () => {
  let scheduler;

  beforeEach(() => {
    scheduler = new Scheduler();
  });

  test('应调度任务', () => {
    scheduler.schedule('task1', () => 'result');
    expect(scheduler.getStatus('task1')).toBe('pending');
  });

  test('应执行任务', () => {
    scheduler.schedule('task1', () => 'result');
    expect(scheduler.execute('task1')).toBe('result');
    expect(scheduler.getStatus('task1')).toBe('completed');
  });

  test('应取消任务', () => {
    scheduler.schedule('task1', () => 'result');
    expect(scheduler.cancel('task1')).toBe(true);
    expect(scheduler.getStatus('task1')).toBeUndefined();
  });
});
