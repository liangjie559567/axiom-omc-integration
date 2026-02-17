import TaskQueue from '../TaskQueue.js';

describe('TaskQueue', () => {
  let queue;

  beforeEach(() => {
    queue = new TaskQueue();
  });

  test('应正确添加任务', () => {
    queue.add({ id: '1', name: 'test' });
    expect(queue.next()).toBeDefined();
  });

  test('应返回下一个待处理任务', () => {
    queue.add({ id: '1', name: 'task1' });
    queue.add({ id: '2', name: 'task2' });
    const next = queue.next();
    expect(next.id).toBe('1');
  });

  test('应正确标记任务完成', () => {
    queue.add({ id: '1', name: 'test' });
    queue.complete('1');
    expect(queue.next()).toBeUndefined();
  });
});
