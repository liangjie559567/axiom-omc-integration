import HUDStatusline from '../HUDStatusline.js';

describe('HUDStatusline', () => {
  let hud;

  beforeEach(() => {
    hud = new HUDStatusline();
  });

  test('应更新状态', () => {
    hud.update({ active: true, progress: 50 });
    expect(hud.getStatus().progress).toBe(50);
  });

  test('应重置状态', () => {
    hud.update({ active: true });
    hud.reset();
    expect(hud.getStatus().active).toBe(false);
  });
});
