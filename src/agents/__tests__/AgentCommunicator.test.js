import AgentCommunicator from '../AgentCommunicator.js';

describe('AgentCommunicator', () => {
  let comm;

  beforeEach(() => {
    comm = new AgentCommunicator();
  });

  test('应正确发送消息', () => {
    comm.send('agent1', 'agent2', 'test');
    expect(comm.messages.length).toBe(1);
  });

  test('应正确接收消息', () => {
    comm.send('agent1', 'agent2', 'test');
    const msgs = comm.receive('agent2');
    expect(msgs.length).toBe(1);
  });
});
