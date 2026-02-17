import DataTransformer from '../DataTransformer.js';

describe('DataTransformer', () => {
  let transformer;

  beforeEach(() => {
    transformer = new DataTransformer();
  });

  test('应注册和执行转换', () => {
    transformer.register('double', (x) => x * 2);
    expect(transformer.transform('double', 5)).toBe(10);
  });

  test('无转换器时返回原数据', () => {
    expect(transformer.transform('unknown', 5)).toBe(5);
  });
});
