import TDDCycle from '../TDDCycle.js';

describe('TDDCycle', () => {
  let cycle;

  beforeEach(() => {
    cycle = new TDDCycle();
  });

  test('应启动 RED 阶段', () => {
    expect(cycle.start()).toBe('RED');
  });

  test('应切换到下一阶段', () => {
    cycle.start();
    expect(cycle.nextPhase()).toBe('GREEN');
    expect(cycle.nextPhase()).toBe('REFACTOR');
  });

  test('应循环回到 RED', () => {
    cycle.start();
    cycle.nextPhase();
    cycle.nextPhase();
    expect(cycle.nextPhase()).toBe('RED');
  });

  test('应验证阶段', () => {
    expect(cycle.validatePhase('RED')).toBe(true);
    expect(cycle.validatePhase('INVALID')).toBe(false);
  });

  test('应获取当前阶段', () => {
    cycle.start();
    expect(cycle.getCurrentPhase()).toBe('RED');
  });
});
