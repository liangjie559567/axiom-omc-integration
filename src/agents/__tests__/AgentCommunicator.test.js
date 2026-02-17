import AgentCommunicator from '../AgentCommunicator.js';

describe('AgentCommunicator', () => {
  let comm;

  beforeEach(() => {
    comm = new AgentCommunicator();
  });

  test('应正确发送消息', () => {
    const msg = comm.send('agent1', 'agent2', 'test');
    expect(msg.from).toBe('agent1');
    expect(msg.to).toBe('agent2');
    expect(msg.message).toBe('test');
  });

  test('应正确获取指定agent的消息', () => {
    comm.send('a1', 'a2', 'msg1');
    comm.send('a1', 'a3', 'msg2');
    const msgs = comm.getMessages('a2');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].message).toBe('msg1');
  });
});
