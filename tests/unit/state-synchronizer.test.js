/**
 * StateSynchronizer 单元测试
 */

import {
  StateSynchronizer,
  SyncDirection,
  ConflictResolution,
  createStateSynchronizer
} from '../../src/core/state-synchronizer.js';
import { writeFile, unlink, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

describe('StateSynchronizer', () => {
  let synchronizer;
  let testDir;

  beforeEach(async () => {
    testDir = join(process.cwd(), 'test-sync');

    synchronizer = new StateSynchronizer({
      axiomRoot: join(testDir, '.agent'),
      omcRoot: join(testDir, '.omc'),
      autoSync: false
    });

    // 创建测试目录
    await mkdir(join(testDir, '.agent'), { recursive: true });
    await mkdir(join(testDir, '.omc'), { recursive: true });
  });

  afterEach(async () => {
    synchronizer.destroy();

    // 清理测试目录
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe('构造函数', () => {
    test('应该创建同步器实例', () => {
      expect(synchronizer).toBeDefined();
      expect(synchronizer.syncMappings).toBeDefined();
      expect(synchronizer.syncHistory).toBeDefined();
    });

    test('应该使用默认配置', () => {
      expect(synchronizer.config.conflictResolution).toBe(ConflictResolution.LATEST);
      expect(synchronizer.config.autoSync).toBe(false);
      expect(synchronizer.config.enableChecksum).toBe(true);
    });

    test('应该使用自定义配置', () => {
      const custom = new StateSynchronizer({
        conflictResolution: ConflictResolution.OMC_PRIORITY,
        syncInterval: 10000
      });

      expect(custom.config.conflictResolution).toBe(ConflictResolution.OMC_PRIORITY);
      expect(custom.config.syncInterval).toBe(10000);

      custom.destroy();
    });
  });

  describe('registerMapping', () => {
    test('应该注册同步映射', () => {
      synchronizer.registerMapping('memory/test.md', 'memory/test.json');

      expect(synchronizer.syncMappings.size).toBe(1);
    });

    test('应该支持自定义选项', () => {
      synchronizer.registerMapping('memory/test.md', 'memory/test.json', {
        direction: SyncDirection.AXIOM_TO_OMC,
        format: 'markdown'
      });

      const mapping = synchronizer.syncMappings.values().next().value;
      expect(mapping.direction).toBe(SyncDirection.AXIOM_TO_OMC);
      expect(mapping.format).toBe('markdown');
    });

    test('应该触发 mappingRegistered 事件', (done) => {
      synchronizer.on('mappingRegistered', () => {
        done();
      });

      synchronizer.registerMapping('memory/test.md', 'memory/test.json');
    });
  });

  describe('sync', () => {
    test('应该同步文件（Axiom -> OMC）', async () => {
      const axiomFile = join(testDir, '.agent', 'test.txt');
      const omcFile = join(testDir, '.omc', 'test.txt');

      await writeFile(axiomFile, 'test content', 'utf-8');

      const mapping = {
        axiomPath: axiomFile,
        omcPath: omcFile,
        direction: SyncDirection.BIDIRECTIONAL,
        format: 'auto'
      };

      const result = await synchronizer.sync(mapping);

      expect(result.success).toBe(true);
      expect(existsSync(omcFile)).toBe(true);
    });

    test('应该同步文件（OMC -> Axiom）', async () => {
      const axiomFile = join(testDir, '.agent', 'test.txt');
      const omcFile = join(testDir, '.omc', 'test.txt');

      await writeFile(omcFile, 'test content', 'utf-8');

      const mapping = {
        axiomPath: axiomFile,
        omcPath: omcFile,
        direction: SyncDirection.BIDIRECTIONAL,
        format: 'auto'
      };

      const result = await synchronizer.sync(mapping);

      expect(result.success).toBe(true);
      expect(existsSync(axiomFile)).toBe(true);
    });

    test('应该跳过相同内容的文件', async () => {
      const axiomFile = join(testDir, '.agent', 'test.txt');
      const omcFile = join(testDir, '.omc', 'test.txt');

      await writeFile(axiomFile, 'same content', 'utf-8');
      await writeFile(omcFile, 'same content', 'utf-8');

      const mapping = {
        axiomPath: axiomFile,
        omcPath: omcFile,
        direction: SyncDirection.BIDIRECTIONAL,
        format: 'auto'
      };

      const result = await synchronizer.sync(mapping);

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('content_identical');
    });

    test('应该跳过不存在的文件', async () => {
      const axiomFile = join(testDir, '.agent', 'nonexistent.txt');
      const omcFile = join(testDir, '.omc', 'nonexistent.txt');

      const mapping = {
        axiomPath: axiomFile,
        omcPath: omcFile,
        direction: SyncDirection.BIDIRECTIONAL,
        format: 'auto'
      };

      const result = await synchronizer.sync(mapping);

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('both_files_missing');
    });

    test('应该根据修改时间决定同步方向', async () => {
      const axiomFile = join(testDir, '.agent', 'test.txt');
      const omcFile = join(testDir, '.omc', 'test.txt');

      await writeFile(axiomFile, 'old content', 'utf-8');
      await new Promise(resolve => setTimeout(resolve, 100));
      await writeFile(omcFile, 'new content', 'utf-8');

      const mapping = {
        axiomPath: axiomFile,
        omcPath: omcFile,
        direction: SyncDirection.BIDIRECTIONAL,
        format: 'auto'
      };

      const result = await synchronizer.sync(mapping);

      expect(result.success).toBe(true);
      expect(result.direction).toBe('omc_to_axiom');
    });
  });

  describe('syncAll', () => {
    test('应该同步所有映射', async () => {
      const axiomFile1 = join(testDir, '.agent', 'test1.txt');
      const omcFile1 = join(testDir, '.omc', 'test1.txt');
      const axiomFile2 = join(testDir, '.agent', 'test2.txt');
      const omcFile2 = join(testDir, '.omc', 'test2.txt');

      await writeFile(axiomFile1, 'content1', 'utf-8');
      await writeFile(axiomFile2, 'content2', 'utf-8');

      synchronizer.registerMapping('test1.txt', 'test1.txt');
      synchronizer.registerMapping('test2.txt', 'test2.txt');

      const results = await synchronizer.syncAll();

      expect(results.total).toBe(2);
      expect(results.successful).toBeGreaterThan(0);
    });

    test('应该跳过禁用的映射', async () => {
      synchronizer.registerMapping('test1.txt', 'test1.txt', {
        enabled: false
      });

      const results = await synchronizer.syncAll();

      expect(results.skipped).toBe(1);
    });
  });

  describe('syncManual', () => {
    test('应该手动同步文件', async () => {
      const axiomFile = join(testDir, '.agent', 'manual.txt');
      await writeFile(axiomFile, 'manual content', 'utf-8');

      const result = await synchronizer.syncManual(
        'manual.txt',
        'manual.txt',
        SyncDirection.AXIOM_TO_OMC
      );

      expect(result.success).toBe(true);
      expect(existsSync(join(testDir, '.omc', 'manual.txt'))).toBe(true);
    });
  });

  describe('autoSync', () => {
    test('应该启动自动同步', () => {
      const autoSync = new StateSynchronizer({
        axiomRoot: join(testDir, '.agent'),
        omcRoot: join(testDir, '.omc'),
        autoSync: true,
        syncInterval: 100
      });

      autoSync.startAutoSync();

      expect(autoSync.syncTimer).toBeDefined();

      autoSync.stopAutoSync();
      autoSync.destroy();
    });

    test('应该停止自动同步', () => {
      const autoSync = new StateSynchronizer({
        axiomRoot: join(testDir, '.agent'),
        omcRoot: join(testDir, '.omc'),
        autoSync: true,
        syncInterval: 100
      });

      autoSync.startAutoSync();
      autoSync.stopAutoSync();

      expect(autoSync.syncTimer).toBeNull();

      autoSync.destroy();
    });
  });

  describe('getSyncHistory', () => {
    test('应该获取同步历史', async () => {
      const axiomFile = join(testDir, '.agent', 'test.txt');
      await writeFile(axiomFile, 'content', 'utf-8');

      const mapping = {
        axiomPath: axiomFile,
        omcPath: join(testDir, '.omc', 'test.txt'),
        direction: SyncDirection.BIDIRECTIONAL,
        format: 'auto'
      };

      await synchronizer.sync(mapping);

      const history = synchronizer.getSyncHistory();

      expect(history.length).toBeGreaterThan(0);
    });

    test('应该按成功状态过滤历史', async () => {
      const axiomFile = join(testDir, '.agent', 'test.txt');
      await writeFile(axiomFile, 'content', 'utf-8');

      const mapping = {
        axiomPath: axiomFile,
        omcPath: join(testDir, '.omc', 'test.txt'),
        direction: SyncDirection.BIDIRECTIONAL,
        format: 'auto'
      };

      await synchronizer.sync(mapping);

      const history = synchronizer.getSyncHistory({ success: true });

      expect(history.length).toBeGreaterThan(0);
      expect(history.every(h => h.success)).toBe(true);
    });

    test('应该限制历史数量', async () => {
      const axiomFile = join(testDir, '.agent', 'test.txt');
      await writeFile(axiomFile, 'content', 'utf-8');

      const mapping = {
        axiomPath: axiomFile,
        omcPath: join(testDir, '.omc', 'test.txt'),
        direction: SyncDirection.BIDIRECTIONAL,
        format: 'auto'
      };

      await synchronizer.sync(mapping);
      await synchronizer.sync(mapping);
      await synchronizer.sync(mapping);

      const history = synchronizer.getSyncHistory({ limit: 2 });

      expect(history.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getStats', () => {
    test('应该返回统计信息', async () => {
      const axiomFile = join(testDir, '.agent', 'test.txt');
      await writeFile(axiomFile, 'content', 'utf-8');

      const mapping = {
        axiomPath: axiomFile,
        omcPath: join(testDir, '.omc', 'test.txt'),
        direction: SyncDirection.BIDIRECTIONAL,
        format: 'auto'
      };

      await synchronizer.sync(mapping);

      const stats = synchronizer.getStats();

      expect(stats.totalSyncs).toBeGreaterThan(0);
      expect(stats.successRate).toBeDefined();
    });
  });

  describe('冲突解决', () => {
    test('应该使用 LATEST 策略', async () => {
      const sync = new StateSynchronizer({
        axiomRoot: join(testDir, '.agent'),
        omcRoot: join(testDir, '.omc'),
        conflictResolution: ConflictResolution.LATEST,
        autoSync: false
      });

      const axiomFile = join(testDir, '.agent', 'conflict.txt');
      const omcFile = join(testDir, '.omc', 'conflict.txt');

      await writeFile(axiomFile, 'axiom content', 'utf-8');
      await new Promise(resolve => setTimeout(resolve, 100));
      await writeFile(omcFile, 'omc content', 'utf-8');

      const mapping = {
        axiomPath: axiomFile,
        omcPath: omcFile,
        direction: SyncDirection.BIDIRECTIONAL,
        format: 'auto'
      };

      await sync.sync(mapping);

      sync.destroy();
    });

    test('应该使用 OMC_PRIORITY 策略', async () => {
      const sync = new StateSynchronizer({
        axiomRoot: join(testDir, '.agent'),
        omcRoot: join(testDir, '.omc'),
        conflictResolution: ConflictResolution.OMC_PRIORITY,
        autoSync: false
      });

      const axiomFile = join(testDir, '.agent', 'conflict.txt');
      const omcFile = join(testDir, '.omc', 'conflict.txt');

      await writeFile(axiomFile, 'axiom content', 'utf-8');
      await writeFile(omcFile, 'omc content', 'utf-8');

      const mapping = {
        axiomPath: axiomFile,
        omcPath: omcFile,
        direction: SyncDirection.BIDIRECTIONAL,
        format: 'auto'
      };

      await sync.sync(mapping);

      sync.destroy();
    });
  });

  describe('事件', () => {
    test('应该触发 mappingRegistered 事件', (done) => {
      synchronizer.on('mappingRegistered', () => {
        done();
      });

      synchronizer.registerMapping('test.md', 'test.json');
    });

    test('应该触发 syncAllCompleted 事件', async () => {
      let eventFired = false;
      synchronizer.on('syncAllCompleted', () => {
        eventFired = true;
      });

      await synchronizer.syncAll();

      expect(eventFired).toBe(true);
    });
  });

  describe('createStateSynchronizer', () => {
    test('应该创建同步器实例', () => {
      const sync = createStateSynchronizer();
      expect(sync).toBeInstanceOf(StateSynchronizer);
      sync.destroy();
    });
  });

  describe('destroy', () => {
    test('应该清理资源', () => {
      synchronizer.destroy();

      expect(synchronizer.syncTimer).toBeNull();
      expect(synchronizer.syncMappings.size).toBe(0);
    });
  });
});
