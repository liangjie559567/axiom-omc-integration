import GateValidator from '../GateValidator.js';

describe('GateValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new GateValidator();
  });

  test('应正确添加规则', () => {
    validator.addRule('test', async () => ({ valid: true }));
    expect(validator.rules.size).toBe(1);
  });

  test('应正确验证阶段', async () => {
    validator.addRule('test', async () => ({ valid: true }));
    const result = await validator.validate('test', {});
    expect(result.valid).toBe(true);
  });
});
