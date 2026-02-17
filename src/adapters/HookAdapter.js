import fs from 'fs';

export class HookAdapter {
  loadHooksConfig(path) {
    const config = JSON.parse(fs.readFileSync(path, 'utf8'));
    return config.hooks;
  }

  executeHook(event, context) {
    // 执行钩子逻辑
    return { event, context };
  }
}
