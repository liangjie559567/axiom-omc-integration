import agentDefinitions from '../AgentDefinitions.js';

describe('AgentDefinitions', () => {
  test('应包含32个Agent', () => {
    expect(Object.keys(agentDefinitions).length).toBe(32);
  });

  test('每个Agent应有必需字段', () => {
    Object.values(agentDefinitions).forEach(agent => {
      expect(agent).toHaveProperty('name');
      expect(agent).toHaveProperty('model');
      expect(agent).toHaveProperty('role');
    });
  });
});
