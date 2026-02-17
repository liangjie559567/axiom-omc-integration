import { HookAdapter } from '../../../src/adapters/HookAdapter.js';
import fs from 'fs';
import path from 'path';

describe('HookAdapter', () => {
  test('加载钩子配置', () => {
    const testDir = path.join(process.cwd(), 'tests', 'fixtures');
    const testFile = path.join(testDir, 'hooks-config.json');

    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    const mockConfig = {
      hooks: {
        SessionStart: [{ matcher: 'test', command: 'echo test' }]
      }
    };

    fs.writeFileSync(testFile, JSON.stringify(mockConfig));

    const adapter = new HookAdapter();
    const hooks = adapter.loadHooksConfig(testFile);

    expect(hooks).toBeDefined();
    expect(hooks.SessionStart).toBeDefined();
    expect(hooks.SessionStart[0].matcher).toBe('test');

    fs.unlinkSync(testFile);
  });
});
