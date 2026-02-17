import ValidationEngine from '../ValidationEngine.js';

describe('ValidationEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new ValidationEngine();
  });

  test('应添加和执行验证规则', () => {
    engine.addRule('positive', (n) => ({ valid: n > 0 }));
    expect(engine.validate('positive', 5)).toEqual({ valid: true });
    expect(engine.validate('positive', -1)).toEqual({ valid: false });
  });

  test('无规则时返回有效', () => {
    expect(engine.validate('unknown', 123)).toEqual({ valid: true });
  });
});
