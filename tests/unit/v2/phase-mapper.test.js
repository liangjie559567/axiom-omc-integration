import { PhaseMapper } from '../../../src/v2/PhaseMapper.js';
import { EventBus } from '../../../src/core/EventBus.js';

describe('PhaseMapper v2', () => {
  let mapper;
  let bus;

  beforeEach(() => {
    bus = new EventBus();
    mapper = new PhaseMapper(bus);
  });

  test('应该能够注册和执行映射', async () => {
    mapper.registerRule({
      from: 'axiom:draft',
      to: ['omc:planning']
    });

    const result = await mapper.map('axiom:draft');

    expect(result).toEqual(['omc:planning']);
  });
});
