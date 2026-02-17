import TDDValidator from '../TDDValidator.js';

describe('TDDValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new TDDValidator();
  });

  test('应正确验证TDD阶段', () => {
    const result = validator.validate('red', {});
    expect(result.valid).toBe(true);
  });

  test('应强制测试优先', () => {
    const result = validator.enforceTestFirst(false);
    expect(result.valid).toBe(false);
  });
});
