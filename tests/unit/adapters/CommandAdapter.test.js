import { CommandAdapter } from '../../../src/adapters/CommandAdapter.js';
import fs from 'fs';
import path from 'path';

describe('CommandAdapter', () => {
  test('加载 Markdown 命令', () => {
    // 创建临时测试文件
    const testDir = path.join(process.cwd(), 'tests', 'fixtures');
    const testFile = path.join(testDir, 'test-command.md');

    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    const mockContent = `---
description: "测试命令"
disable-model-invocation: true
---

命令内容`;

    fs.writeFileSync(testFile, mockContent);

    const adapter = new CommandAdapter();
    const cmd = adapter.loadMarkdownCommand(testFile);

    expect(cmd.name).toBe('test-command');
    expect(cmd.description).toBe('测试命令');
    expect(cmd.disableModelInvocation).toBe(true);
    expect(cmd.handler().trim()).toBe('命令内容');

    // 清理
    fs.unlinkSync(testFile);
  });
});
