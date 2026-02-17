import { AutoSyncEngine } from '../../../src/v2/AutoSyncEngine.js';
import { CommandHandler } from '../../../src/cqrs/CommandHandler.js';
import { EventStore } from '../../../src/core/EventStore.js';
import { EventBus } from '../../../src/core/EventBus.js';

describe('AutoSyncEngine v2', () => {
  let engine;

  beforeEach(() => {
    const store = new EventStore();
    const bus = new EventBus();
    const handler = new CommandHandler(store, bus);
    engine = new AutoSyncEngine(handler);
  });

  test('应该能够入队和处理同步任务', async () => {
    await engine.enqueue({ source: 'wf-1', target: 'wf-2' });
    await engine.process();

    expect(engine.queue.length).toBe(0);
  });
});
