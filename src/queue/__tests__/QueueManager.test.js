import QueueManager from '../QueueManager.js';

describe('QueueManager', () => {
  let queue;

  beforeEach(() => {
    queue = new QueueManager();
  });

  test('应入队和出队', () => {
    queue.enqueue('item1');
    expect(queue.dequeue()).toBe('item1');
  });

  test('应返回队列大小', () => {
    queue.enqueue('item1');
    queue.enqueue('item2');
    expect(queue.size()).toBe(2);
  });

  test('应清空队列', () => {
    queue.enqueue('item1');
    queue.clear();
    expect(queue.size()).toBe(0);
  });
});
