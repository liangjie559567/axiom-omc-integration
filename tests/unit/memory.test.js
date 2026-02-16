/**
 * 记忆管理系统单元测试
 */

import { MemoryManager } from '../../src/memory/index.js';

describe('MemoryManager', () => {
  let memory;

  beforeEach(() => {
    memory = new MemoryManager();
  });

  describe('对话管理', () => {
    it('应该添加对话', () => {
      memory.addConversation('conv1', { role: 'user', content: '你好' });
      const conv = memory.getConversation('conv1');
      expect(conv).toHaveLength(1);
      expect(conv[0].content).toBe('你好');
    });

    it('应该获取对话历史', () => {
      memory.addConversation('conv1', { role: 'user', content: '消息1' });
      memory.addConversation('conv1', { role: 'assistant', content: '回复1' });
      const conv = memory.getConversation('conv1');
      expect(conv).toHaveLength(2);
    });
  });

  describe('上下文管理', () => {
    it('应该设置和获取上下文', () => {
      memory.setContext('user', { id: 1, name: '张三' });
      const ctx = memory.getContext('user');
      expect(ctx.name).toBe('张三');
    });
  });

  describe('知识库管理', () => {
    it('应该添加知识项', () => {
      memory.addKnowledge({ id: 1, content: 'JavaScript 基础' });
      expect(memory.knowledge).toHaveLength(1);
    });

    it('应该搜索知识', () => {
      memory.addKnowledge({ id: 1, content: 'JavaScript 基础' });
      memory.addKnowledge({ id: 2, content: 'Python 教程' });
      const results = memory.searchKnowledge('JavaScript');
      expect(results).toHaveLength(1);
      expect(results[0].content).toContain('JavaScript');
    });
  });
});
