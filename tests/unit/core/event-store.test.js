import { EventStore } from '../../../src/core/EventStore.js';

describe('EventStore', () => {
  let store;

  beforeEach(() => {
    store = new EventStore();
  });

  test('应该能够追加事件', () => {
    const event = store.append({
      type: 'TEST',
      instanceId: 'test-1',
      data: { value: 1 }
    });

    expect(event.id).toBeDefined();
    expect(event.timestamp).toBeDefined();
  });

  test('应该能够获取实例的所有事件', () => {
    store.append({ type: 'A', instanceId: 'test-1' });
    store.append({ type: 'B', instanceId: 'test-1' });
    store.append({ type: 'C', instanceId: 'test-2' });

    const events = store.getEvents('test-1');
    expect(events).toHaveLength(2);
  });
});
