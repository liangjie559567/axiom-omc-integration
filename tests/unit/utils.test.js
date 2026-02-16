/**
 * 工具函数单元测试
 */

import { jest } from '@jest/globals';
import { delay, retry, deepMerge, generateId, formatTime } from '../../src/utils/index.js';

describe('Utils', () => {
  describe('delay', () => {
    it('应该延迟指定的毫秒数', async () => {
      const start = Date.now();
      await delay(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });

  describe('retry', () => {
    it('应该在成功时返回结果', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await retry(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('应该在失败后重试', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');
      const result = await retry(fn, { maxAttempts: 2, delayMs: 10 });
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('deepMerge', () => {
    it('应该合并对象', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });
  });

  describe('generateId', () => {
    it('应该生成唯一 ID', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
    });
  });

  describe('formatTime', () => {
    it('应该格式化毫秒', () => {
      expect(formatTime(500)).toBe('500ms');
      expect(formatTime(1500)).toMatch(/1\.\d+s/);
    });
  });
});
