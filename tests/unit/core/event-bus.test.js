import { EventBus } from '../../../src/core/EventBus.js';

describe('EventBus', () => {
  let bus;

  beforeEach(() => {
    bus = new EventBus();
  });

  test('应该能够订阅和发布事件', async () => {
    let called = false;
    let receivedEvent = null;

    bus.subscribe('TEST', (event) => {
      called = true;
      receivedEvent = event;
    });

    await bus.publish({ type: 'TEST', data: 1 });

    expect(called).toBe(true);
    expect(receivedEvent.data).toBe(1);
  });

  test('应该支持多个订阅者', async () => {
    let count = 0;

    bus.subscribe('TEST', () => count++);
    bus.subscribe('TEST', () => count++);

    await bus.publish({ type: 'TEST' });

    expect(count).toBe(2);
  });
});
