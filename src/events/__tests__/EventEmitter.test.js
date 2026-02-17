import EventEmitter from '../EventEmitter.js';

describe('EventEmitter', () => {
  let emitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  test('应订阅事件', () => {
    let called = false;
    const handler = () => { called = true; };
    emitter.on('test', handler);
    emitter.emit('test', 'data');
    expect(called).toBe(true);
  });

  test('应取消订阅', () => {
    let called = false;
    const handler = () => { called = true; };
    emitter.on('test', handler);
    emitter.off('test', handler);
    emitter.emit('test', 'data');
    expect(called).toBe(false);
  });
});
