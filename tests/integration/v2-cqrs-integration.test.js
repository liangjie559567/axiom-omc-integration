/**
 * CQRS 模式集成测试
 */

import { EventStore } from '../../src/core/EventStore.js';
import { EventBus } from '../../src/core/EventBus.js';
import { CommandHandler } from '../../src/cqrs/CommandHandler.js';
import { QueryHandler } from '../../src/cqrs/QueryHandler.js';
import { ReadModel } from '../../src/cqrs/ReadModel.js';

describe('CQRS 集成测试', () => {
  let store, bus, readModel, cmd, query;

  beforeEach(() => {
    store = new EventStore();
    bus = new EventBus();
    readModel = new ReadModel();
    cmd = new CommandHandler(store, bus);
    query = new QueryHandler(readModel);
  });

  test('命令应该生成事件', async () => {
    const result = await cmd.execute({
      type: 'START_WORKFLOW',
      instanceId: 'test',
      data: {}
    });

    expect(result.instanceId).toBe('test');
  });

  test('事件应该被存储', async () => {
    await cmd.execute({
      type: 'START_WORKFLOW',
      instanceId: 'test',
      data: { title: 'Test' }
    });

    const events = store.getEvents('test');
    expect(events.length).toBeGreaterThan(0);
  });
});
