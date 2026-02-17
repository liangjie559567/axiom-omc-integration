import ErrorDetector from '../ErrorDetector.js';

describe('ErrorDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new ErrorDetector();
  });

  test('应检测错误', () => {
    const result = detector.detect('op1', { error: 'test error' });
    expect(result).toBe(true);
    expect(detector.getErrors()).toHaveLength(1);
  });

  test('无错误时返回 false', () => {
    const result = detector.detect('op1', { success: true });
    expect(result).toBe(false);
  });
});
