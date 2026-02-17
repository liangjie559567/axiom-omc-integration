import GateValidator from '../GateValidator.js';

describe('GateValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new GateValidator();
  });

  test('应添加和执行验证规则', () => {
    validator.addRule('stage1', (ctx) => ctx.valid === true);
    expect(validator.validate('stage1', { valid: true })).toBe(true);
    expect(validator.validate('stage1', { valid: false })).toBe(false);
  });

  test('无规则时应通过验证', () => {
    expect(validator.validate('stage1', {})).toBe(true);
  });
});
