import IntegrationBridge from '../IntegrationBridge.js';

describe('IntegrationBridge', () => {
  let bridge;

  beforeEach(() => {
    bridge = new IntegrationBridge();
  });

  test('应连接源和目标', () => {
    bridge.connect('axiom', 'omc');
    expect(bridge.getTarget('axiom')).toBe('omc');
  });

  test('应断开连接', () => {
    bridge.connect('axiom', 'omc');
    expect(bridge.disconnect('axiom')).toBe(true);
    expect(bridge.getTarget('axiom')).toBeUndefined();
  });

  test('应列出所有连接', () => {
    bridge.connect('axiom', 'omc');
    bridge.connect('omc', 'superpowers');
    expect(bridge.listConnections().length).toBe(2);
  });
});
