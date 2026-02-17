import { CommandAdapter } from '../../src/adapters/CommandAdapter.js';
import { HookAdapter } from '../../src/adapters/HookAdapter.js';
import fs from 'fs';
import path from 'path';

describe('Superpowers Integration', () => {
  test('CommandAdapter 加载 Markdown 命令', () => {
    const adapter = new CommandAdapter();
    const cmd = adapter.loadMarkdownCommand('commands/markdown/brainstorm.md');

    expect(cmd.name).toBe('brainstorm');
    expect(cmd.description).toBe('You MUST use this before any creative work');
    expect(cmd.disableModelInvocation).toBe(true);
  });

  test('HookAdapter 加载配置', () => {
    const adapter = new HookAdapter();
    const hooks = adapter.loadHooksConfig('hooks/hooks.json');

    expect(hooks).toBeDefined();
    expect(hooks.SessionStart).toBeDefined();
  });
});
