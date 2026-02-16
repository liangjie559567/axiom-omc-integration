/**
 * 状态管理器单元测试
 */

import { StateManager } from '../../src/core/state-manager.js';
import fs from 'fs/promises';
import path from 'path';

describe('StateManager', () => {
  let stateManager;
  const testStateDir = path.join(process.cwd(), '.test-state');
  const testStatePath = path.join(testStateDir, 'state.json');

  beforeEach(async () => {
    // 创建测试目录
    await fs.mkdir(testStateDir, { recursive: true });

    // 创建测试实例
    stateManager = new StateManager({
      persistPath: testStatePath,
      enableHistory: true,
      maxHistorySize: 50
    });
  });

  afterEach(async () => {
    // 清理测试数据
    try {
      await fs.rm(testStateDir, { recursive: true, force: true });
    } catch (error) {
      // 忽略清理错误
    }
  });

  describe('构造函数', () => {
    it('应该创建状态管理器实例', () => {
      expect(stateManager).toBeInstanceOf(StateManager);
      expect(stateManager.state).toEqual({});
      expect(stateManager.history).toEqual([]);
    });

    it('应该使用默认配置', () => {
      const defaultManager = new StateManager();
      expect(defaultManager.persistPath).toBe('.agent/state/state.json');
      expect(defaultManager.enableHistory).toBe(true);
      expect(defaultManager.maxHistorySize).toBe(100);
    });

    it('应该支持自定义配置', () => {
      const customManager = new StateManager({
        persistPath: '/custom/path/state.json',
        enableHistory: false,
        maxHistorySize: 200
      });

      expect(customManager.persistPath).toBe('/custom/path/state.json');
      expect(customManager.enableHistory).toBe(false);
      expect(customManager.maxHistorySize).toBe(200);
    });
  });

  describe('setState', () => {
    it('应该设置状态值', () => {
      stateManager.setState('key1', 'value1');
      expect(stateManager.getState('key1')).toBe('value1');
    });

    it('应该支持链式调用', () => {
      const result = stateManager
        .setState('key1', 'value1')
        .setState('key2', 'value2');

      expect(result).toBe(stateManager);
      expect(stateManager.getState('key1')).toBe('value1');
      expect(stateManager.getState('key2')).toBe('value2');
    });

    it('应该触发 stateChange 事件', (done) => {
      stateManager.on('stateChange', ({ key, oldValue, newValue }) => {
        expect(key).toBe('testKey');
        expect(oldValue).toBeUndefined();
        expect(newValue).toBe('testValue');
        done();
      });

      stateManager.setState('testKey', 'testValue');
    });

    it('应该触发特定键的 stateChange 事件', (done) => {
      stateManager.on('stateChange:specificKey', ({ oldValue, newValue }) => {
        expect(oldValue).toBeUndefined();
        expect(newValue).toBe('specificValue');
        done();
      });

      stateManager.setState('specificKey', 'specificValue');
    });

    it('应该支持静默模式（不触发事件）', () => {
      let eventFired = false;
      stateManager.on('stateChange', () => {
        eventFired = true;
      });

      stateManager.setState('key1', 'value1', { silent: true });
      expect(stateManager.getState('key1')).toBe('value1');
      expect(eventFired).toBe(false);
    });

    it('应该记录历史变更', () => {
      stateManager.setState('key1', 'value1');
      stateManager.setState('key1', 'value2');

      expect(stateManager.history.length).toBe(2);
      expect(stateManager.history[0].key).toBe('key1');
      expect(stateManager.history[0].oldValue).toBeUndefined();
      expect(stateManager.history[0].newValue).toBe('value1');
      expect(stateManager.history[1].oldValue).toBe('value1');
      expect(stateManager.history[1].newValue).toBe('value2');
    });

    it('应该支持元数据', () => {
      const metadata = { user: 'test', reason: 'testing' };
      stateManager.setState('key1', 'value1', { metadata });

      expect(stateManager.history[0].metadata).toEqual(metadata);
    });

    it('应该限制历史记录大小', () => {
      const smallHistoryManager = new StateManager({ maxHistorySize: 3 });

      for (let i = 0; i < 5; i++) {
        smallHistoryManager.setState(`key${i}`, `value${i}`);
      }

      expect(smallHistoryManager.history.length).toBe(3);
      expect(smallHistoryManager.history[0].key).toBe('key2');
      expect(smallHistoryManager.history[2].key).toBe('key4');
    });
  });

  describe('getState', () => {
    beforeEach(() => {
      stateManager.setState('existingKey', 'existingValue');
    });

    it('应该获取存在的状态值', () => {
      expect(stateManager.getState('existingKey')).toBe('existingValue');
    });

    it('应该返回默认值当键不存在', () => {
      expect(stateManager.getState('nonExistentKey', 'default')).toBe('default');
    });

    it('应该返回 undefined 当键不存在且无默认值', () => {
      expect(stateManager.getState('nonExistentKey')).toBeUndefined();
    });
  });

  describe('getAllState', () => {
    it('应该返回所有状态', () => {
      stateManager.setState('key1', 'value1');
      stateManager.setState('key2', 'value2');

      const allState = stateManager.getAllState();
      expect(allState).toEqual({
        key1: 'value1',
        key2: 'value2'
      });
    });

    it('应该返回状态的副本', () => {
      stateManager.setState('key1', 'value1');
      const allState = stateManager.getAllState();
      allState.key1 = 'modified';

      expect(stateManager.getState('key1')).toBe('value1');
    });
  });

  describe('deleteState', () => {
    beforeEach(() => {
      stateManager.setState('key1', 'value1');
      stateManager.setState('key2', 'value2');
    });

    it('应该删除状态', () => {
      const result = stateManager.deleteState('key1');
      expect(result).toBe(true);
      expect(stateManager.hasState('key1')).toBe(false);
    });

    it('应该返回 false 当键不存在', () => {
      const result = stateManager.deleteState('nonExistentKey');
      expect(result).toBe(false);
    });

    it('应该触发 stateDeleted 事件', (done) => {
      stateManager.on('stateDeleted', ({ key, oldValue }) => {
        expect(key).toBe('key1');
        expect(oldValue).toBe('value1');
        done();
      });

      stateManager.deleteState('key1');
    });

    it('应该支持静默模式', () => {
      let eventFired = false;
      stateManager.on('stateDeleted', () => {
        eventFired = true;
      });

      stateManager.deleteState('key1', { silent: true });
      expect(stateManager.hasState('key1')).toBe(false);
      expect(eventFired).toBe(false);
    });
  });

  describe('hasState', () => {
    beforeEach(() => {
      stateManager.setState('existingKey', 'value');
    });

    it('应该检查状态是否存在', () => {
      expect(stateManager.hasState('existingKey')).toBe(true);
      expect(stateManager.hasState('nonExistentKey')).toBe(false);
    });
  });

  describe('setStates', () => {
    it('应该批量设置状态', () => {
      stateManager.setStates({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3'
      });

      expect(stateManager.getState('key1')).toBe('value1');
      expect(stateManager.getState('key2')).toBe('value2');
      expect(stateManager.getState('key3')).toBe('value3');
    });

    it('应该支持静默模式', () => {
      let eventCount = 0;
      stateManager.on('stateChange', () => {
        eventCount++;
      });

      stateManager.setStates({
        key1: 'value1',
        key2: 'value2'
      }, { silent: true });

      expect(eventCount).toBe(0);
    });
  });

  describe('subscribe', () => {
    it('应该订阅状态变更', () => {
      const calls = [];
      const callback = (...args) => calls.push(args);
      stateManager.subscribe('testKey', callback);

      stateManager.setState('testKey', 'value1');
      expect(calls[0]).toEqual(['value1', undefined]);

      stateManager.setState('testKey', 'value2');
      expect(calls[1]).toEqual(['value2', 'value1']);
    });

    it('应该返回取消订阅函数', () => {
      const calls = [];
      const callback = (...args) => calls.push(args);
      const unsubscribe = stateManager.subscribe('testKey', callback);

      stateManager.setState('testKey', 'value1');
      expect(calls.length).toBe(1);

      unsubscribe();
      stateManager.setState('testKey', 'value2');
      expect(calls.length).toBe(1);
    });

    it('应该支持多个订阅者', () => {
      const calls1 = [];
      const calls2 = [];
      const callback1 = (...args) => calls1.push(args);
      const callback2 = (...args) => calls2.push(args);

      stateManager.subscribe('testKey', callback1);
      stateManager.subscribe('testKey', callback2);

      stateManager.setState('testKey', 'value');

      expect(calls1[0]).toEqual(['value', undefined]);
      expect(calls2[0]).toEqual(['value', undefined]);
    });
  });

  describe('getHistory', () => {
    beforeEach(() => {
      stateManager.setState('key1', 'value1');
      stateManager.setState('key2', 'value2');
      stateManager.setState('key1', 'value1-updated');
    });

    it('应该获取所有历史记录', () => {
      const history = stateManager.getHistory();
      expect(history.length).toBe(3);
    });

    it('应该限制返回的历史记录数量', () => {
      const history = stateManager.getHistory(null, 2);
      expect(history.length).toBe(2);
      expect(history[0].key).toBe('key2');
      expect(history[1].key).toBe('key1');
    });

    it('应该按键过滤历史记录', () => {
      const history = stateManager.getHistory('key1');
      expect(history.length).toBe(2);
      expect(history.every(h => h.key === 'key1')).toBe(true);
    });
  });

  describe('clearHistory', () => {
    it('应该清空历史记录', () => {
      stateManager.setState('key1', 'value1');
      stateManager.setState('key2', 'value2');

      expect(stateManager.history.length).toBe(2);

      stateManager.clearHistory();
      expect(stateManager.history.length).toBe(0);
    });
  });

  describe('reset', () => {
    it('应该重置状态', () => {
      stateManager.setState('key1', 'value1');
      stateManager.setState('key2', 'value2');

      stateManager.reset();

      expect(stateManager.getAllState()).toEqual({});
      expect(stateManager.history.length).toBe(0);
    });

    it('应该触发 stateReset 事件', (done) => {
      stateManager.on('stateReset', () => {
        done();
      });

      stateManager.reset();
    });

    it('应该支持静默模式', () => {
      let eventFired = false;
      stateManager.on('stateReset', () => {
        eventFired = true;
      });

      stateManager.reset({ silent: true });
      expect(eventFired).toBe(false);
    });
  });

  describe('save', () => {
    it('应该保存状态到文件', async () => {
      stateManager.setState('key1', 'value1');
      stateManager.setState('key2', 'value2');

      await stateManager.save();

      const content = await fs.readFile(testStatePath, 'utf-8');
      const saved = JSON.parse(content);

      expect(saved.state).toEqual({
        key1: 'value1',
        key2: 'value2'
      });
    });

    it('应该保存历史记录', async () => {
      stateManager.setState('key1', 'value1');
      await stateManager.save();

      const content = await fs.readFile(testStatePath, 'utf-8');
      const saved = JSON.parse(content);

      expect(saved.history).toBeDefined();
      expect(saved.history.length).toBe(1);
    });

    it('应该创建目录如果不存在', async () => {
      const deepPath = path.join(testStateDir, 'deep', 'nested', 'state.json');
      const deepManager = new StateManager({ persistPath: deepPath });

      deepManager.setState('key1', 'value1');
      await deepManager.save();

      const exists = await fs.access(deepPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('load', () => {
    it('应该从文件加载状态', async () => {
      // 先保存
      stateManager.setState('key1', 'value1');
      stateManager.setState('key2', 'value2');
      await stateManager.save();

      // 创建新实例并加载
      const newManager = new StateManager({ persistPath: testStatePath });
      await newManager.load();

      expect(newManager.getState('key1')).toBe('value1');
      expect(newManager.getState('key2')).toBe('value2');
    });

    it('应该加载历史记录', async () => {
      stateManager.setState('key1', 'value1');
      await stateManager.save();

      const newManager = new StateManager({ persistPath: testStatePath });
      await newManager.load();

      expect(newManager.history.length).toBe(1);
    });

    it('应该处理不存在的文件', async () => {
      const nonExistentPath = path.join(testStateDir, 'nonexistent.json');
      const newManager = new StateManager({ persistPath: nonExistentPath });

      await expect(newManager.load()).resolves.not.toThrow();
      expect(newManager.getAllState()).toEqual({});
    });
  });

  describe('getStats', () => {
    it('应该返回统计信息', () => {
      stateManager.setState('key1', 'value1');
      stateManager.setState('key2', 'value2');

      const stats = stateManager.getStats();

      expect(stats.stateKeys).toBe(2);
      expect(stats.historySize).toBe(2);
      expect(Array.isArray(stats.subscribers)).toBe(true);
      expect(stats.subscribers.length).toBe(0);
    });

    it('应该统计订阅者数量', () => {
      stateManager.subscribe('key1', () => {});
      stateManager.subscribe('key2', () => {});

      const stats = stateManager.getStats();
      expect(stats.subscribers.length).toBe(2);
    });
  });

  describe('createSnapshot', () => {
    it('应该创建状态快照', () => {
      stateManager.setState('key1', 'value1');
      stateManager.setState('key2', 'value2');

      const snapshot = stateManager.createSnapshot();

      expect(snapshot.state).toEqual({
        key1: 'value1',
        key2: 'value2'
      });
      expect(snapshot.timestamp).toBeDefined();
    });

    it('快照应该包含状态和时间戳', () => {
      stateManager.setState('key1', 'value1');
      const snapshot = stateManager.createSnapshot();

      expect(snapshot.state).toBeDefined();
      expect(snapshot.timestamp).toBeDefined();
      expect(typeof snapshot.timestamp).toBe('string');
      // 验证是有效的 ISO 时间戳
      expect(new Date(snapshot.timestamp).toISOString()).toBe(snapshot.timestamp);
    });
  });

  describe('restoreSnapshot', () => {
    it('应该恢复状态快照', () => {
      stateManager.setState('key1', 'value1');
      stateManager.setState('key2', 'value2');
      const snapshot = stateManager.createSnapshot();

      stateManager.setState('key1', 'modified');
      stateManager.deleteState('key2');

      stateManager.restoreSnapshot(snapshot);

      expect(stateManager.getState('key1')).toBe('value1');
      expect(stateManager.getState('key2')).toBe('value2');
    });

    it('恢复快照后状态应该匹配', () => {
      stateManager.setState('key1', 'value1');
      const snapshot = stateManager.createSnapshot();

      stateManager.setState('key2', 'value2');
      stateManager.restoreSnapshot(snapshot);

      expect(stateManager.getState('key1')).toBe('value1');
      expect(stateManager.getState('key2')).toBeUndefined();
    });

    it('应该触发 snapshotRestored 事件', (done) => {
      const snapshot = stateManager.createSnapshot();

      stateManager.on('snapshotRestored', () => {
        done();
      });

      stateManager.restoreSnapshot(snapshot);
    });

    it('应该支持静默模式', () => {
      const snapshot = stateManager.createSnapshot();
      let eventFired = false;

      stateManager.on('snapshotRestored', () => {
        eventFired = true;
      });

      stateManager.restoreSnapshot(snapshot, { silent: true });
      expect(eventFired).toBe(false);
    });
  });
});
