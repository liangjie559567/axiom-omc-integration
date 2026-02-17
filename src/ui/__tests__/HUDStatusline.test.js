import HUDStatusline from '../HUDStatusline.js';

describe('HUDStatusline', () => {
  let hud;

  beforeEach(() => {
    hud = new HUDStatusline();
  });

  test('应更新和获取状态', () => {
    hud.update('progress', 50);
    expect(hud.get('progress')).toBe(50);
  });

  test('应获取所有状态', () => {
    hud.update('progress', 50);
    hud.update('stage', 'exec');
    expect(hud.getAll()).toEqual({ progress: 50, stage: 'exec' });
  });

  test('应清空状态', () => {
    hud.update('progress', 50);
    hud.clear();
    expect(hud.getAll()).toEqual({});
  });
});
