import KeywordDetector from '../KeywordDetector.js';

describe('KeywordDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new KeywordDetector();
  });

  test('应检测 autopilot 关键词', () => {
    expect(detector.detect('build me a feature')).toBe('autopilot');
    expect(detector.detect('I want a new component')).toBe('autopilot');
  });

  test('应检测 ralph 关键词', () => {
    expect(detector.detect("don't stop until done")).toBe('ralph');
    expect(detector.detect('must complete this task')).toBe('ralph');
  });

  test('应检测 ultrawork 关键词', () => {
    expect(detector.detect('use ulw mode')).toBe('ultrawork');
  });

  test('无关键词时返回 null', () => {
    expect(detector.detect('just a normal message')).toBe(null);
  });

  test('应支持添加新关键词', () => {
    detector.addKeyword('autopilot', 'create');
    expect(detector.detect('create something')).toBe('autopilot');
  });
});
