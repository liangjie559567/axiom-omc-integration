import MetricsCollector from '../MetricsCollector.js';

describe('MetricsCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  test('应记录和获取指标', () => {
    collector.record('cpu', 50);
    collector.record('cpu', 60);
    const metrics = collector.get('cpu');
    expect(metrics).toHaveLength(2);
    expect(metrics[0].value).toBe(50);
  });

  test('应清除所有指标', () => {
    collector.record('cpu', 50);
    collector.clear();
    expect(collector.get('cpu')).toEqual([]);
  });
});
