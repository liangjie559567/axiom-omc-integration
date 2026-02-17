/**
 * v2 阶段映射集成测试
 */

import { EventStore } from '../../src/core/EventStore.js';
import { EventBus } from '../../src/core/EventBus.js';
import { PhaseMapper } from '../../src/v2/PhaseMapper.js';

describe('PhaseMapper 集成测试', () => {
  let bus, mapper;

  beforeEach(() => {
    bus = new EventBus();
    mapper = new PhaseMapper(bus);
  });

  test('映射规则应该触发事件', async () => {
    let eventReceived = false;
    bus.subscribe('PHASE_MAPPED', () => {
      eventReceived = true;
    });

    mapper.registerRule({ from: 'draft', to: ['planning'] });
    const result = await mapper.map('draft');

    expect(result).toEqual(['planning']);
    expect(eventReceived).toBe(true);
  });

  test('映射应该返回正确结果', async () => {
    mapper.registerRule({ from: 'draft', to: ['planning'] });
    const result = await mapper.map('draft');

    expect(result).toEqual(['planning']);
  });
});
