import AnalyticsEngine from '../AnalyticsEngine.js';

describe('AnalyticsEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new AnalyticsEngine();
  });

  test('应跟踪和查询事件', () => {
    engine.track('click', { button: 'submit' });
    engine.track('click', { button: 'cancel' });
    expect(engine.query('click')).toHaveLength(2);
  });

  test('应清除所有数据', () => {
    engine.track('click', {});
    engine.clear();
    expect(engine.query('click')).toEqual([]);
  });
});
