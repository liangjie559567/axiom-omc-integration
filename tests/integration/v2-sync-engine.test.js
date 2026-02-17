/**
 * v2 同步引擎集成测试
 */

import { EventStore } from '../../src/core/EventStore.js';
import { EventBus } from '../../src/core/EventBus.js';
import { CommandHandler } from '../../src/cqrs/CommandHandler.js';
import { AutoSyncEngine } from '../../src/v2/AutoSyncEngine.js';

describe('AutoSyncEngine 集成测试', () => {
  let store, bus, cmd, engine;

  beforeEach(() => {
    store = new EventStore();
    bus = new EventBus();
    cmd = new CommandHandler(store, bus);
    engine = new AutoSyncEngine(cmd);
  });

  test('同步任务应该入队', async () => {
    await engine.enqueue({ source: 'w1', target: 'w2' });
    expect(engine.queue.length).toBe(1);
  });

  test('同步任务应该被处理', async () => {
    await engine.enqueue({ source: 'w1', target: 'w2' });
    await engine.process();
    expect(engine.queue.length).toBe(0);
  });
});
