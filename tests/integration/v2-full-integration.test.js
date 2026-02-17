/**
 * v2 架构完整集成测试
 */

import { EventStore } from '../../src/core/EventStore.js';
import { EventBus } from '../../src/core/EventBus.js';
import { CommandHandler } from '../../src/cqrs/CommandHandler.js';
import { QueryHandler } from '../../src/cqrs/QueryHandler.js';
import { ReadModel } from '../../src/cqrs/ReadModel.js';
import { PhaseMapper } from '../../src/v2/PhaseMapper.js';
import { AutoSyncEngine } from '../../src/v2/AutoSyncEngine.js';
import { WorkflowOrchestrator } from '../../src/v2/WorkflowOrchestrator.js';

describe('v2 完整集成测试', () => {
  let store, bus, readModel, cmd, query, orchestrator;

  beforeEach(() => {
    store = new EventStore();
    bus = new EventBus();
    readModel = new ReadModel();
    cmd = new CommandHandler(store, bus);
    query = new QueryHandler(readModel);
    orchestrator = new WorkflowOrchestrator(cmd, query);
  });

  test('完整工作流生命周期', async () => {
    const result = await orchestrator.startWorkflow('test-workflow', {
      title: '测试工作流'
    });

    expect(result).toBeDefined();
    expect(result.instanceId).toContain('test-workflow');
  });

  test('事件溯源和状态重建', async () => {
    const result = await orchestrator.startWorkflow('test-workflow', {});

    const events = store.getEvents(result.instanceId);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toBe('START_WORKFLOW');
    expect(events[0].instanceId).toBe(result.instanceId);
    expect(events[0].timestamp).toBeDefined();
  });
});
