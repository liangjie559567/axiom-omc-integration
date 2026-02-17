import StateMachine from '../StateMachine.js';

describe('StateMachine', () => {
  let sm;

  beforeEach(() => {
    sm = new StateMachine('idle');
  });

  test('应转换状态', () => {
    sm.addTransition('idle', 'running');
    expect(sm.transition('running')).toBe(true);
    expect(sm.getState()).toBe('running');
  });

  test('应拒绝非法转换', () => {
    sm.addTransition('idle', 'running');
    expect(sm.transition('stopped')).toBe(false);
    expect(sm.getState()).toBe('idle');
  });
});
