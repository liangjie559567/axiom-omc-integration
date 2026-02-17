import Notifier from '../Notifier.js';

describe('Notifier', () => {
  let notifier;

  beforeEach(() => {
    notifier = new Notifier();
  });

  test('应订阅通知', () => {
    let received = false;
    notifier.subscribe('test', () => { received = true; });
    notifier.notify('test', 'msg');
    expect(received).toBe(true);
  });

  test('应发送消息', () => {
    let msg = '';
    notifier.subscribe('test', (m) => { msg = m; });
    notifier.notify('test', 'hello');
    expect(msg).toBe('hello');
  });
});
