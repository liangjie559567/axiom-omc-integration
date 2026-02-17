import { EventStore } from '../../src/core/EventStore.js';
import { EventBus } from '../../src/core/EventBus.js';

describe('性能基准测试', () => {
  test('EventStore 应该能处理1000个事件', () => {
    const store = new EventStore();
    const start = Date.now();

    for (let i = 0; i < 1000; i++) {
      store.append({ type: 'TEST', instanceId: `wf-${i}` });
    }

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });

  test('EventBus 应该能处理1000次发布', async () => {
    const bus = new EventBus();
    let count = 0;
    bus.subscribe('TEST', () => count++);

    const start = Date.now();

    for (let i = 0; i < 1000; i++) {
      await bus.publish({ type: 'TEST' });
    }

    const duration = Date.now() - start;
    expect(count).toBe(1000);
    expect(duration).toBeLessThan(500);
  });
});
