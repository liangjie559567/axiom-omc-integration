import NotificationManager from '../NotificationManager.js';

describe('NotificationManager', () => {
  let manager;

  beforeEach(() => {
    manager = new NotificationManager();
  });

  test('应注册和发送通知', async () => {
    let received = null;
    manager.registerChannel('email', async (msg) => { received = msg; });
    await manager.notify('email', 'test');
    expect(received).toBe('test');
  });

  test('未注册频道返回 false', async () => {
    const result = await manager.notify('unknown', 'test');
    expect(result).toBe(false);
  });

  test('应列出所有频道', () => {
    manager.registerChannel('email', () => {});
    manager.registerChannel('slack', () => {});
    expect(manager.listChannels()).toEqual(['email', 'slack']);
  });
});
