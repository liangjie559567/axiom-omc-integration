import PerformanceMonitor from '../PerformanceMonitor.js';

describe('PerformanceMonitor', () => {
  let monitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  test('应记录性能指标', () => {
    monitor.record('task1', 100);
    expect(monitor.getMetrics('task1')).toHaveLength(1);
  });

  test('应获取所有指标', () => {
    monitor.record('task1', 100);
    monitor.record('task2', 200);
    expect(monitor.getMetrics()).toHaveLength(2);
  });

  test('应计算平均值', () => {
    monitor.record('task1', 100);
    monitor.record('task1', 200);
    expect(monitor.getAverage('task1')).toBe(150);
  });

  test('应清除指标', () => {
    monitor.record('task1', 100);
    monitor.clear();
    expect(monitor.getMetrics()).toHaveLength(0);
  });
});
