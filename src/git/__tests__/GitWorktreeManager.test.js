import GitWorktreeManager from '../GitWorktreeManager.js';

describe('GitWorktreeManager', () => {
  let manager;

  beforeEach(() => {
    manager = new GitWorktreeManager();
  });

  test('应创建 worktree', () => {
    const path = manager.create('/path/to/worktree', 'feature-branch');
    expect(path).toBe('/path/to/worktree');
    expect(manager.list()).toContain('/path/to/worktree');
  });

  test('应列出所有 worktree', () => {
    manager.create('/path/1', 'branch-1');
    manager.create('/path/2', 'branch-2');
    expect(manager.list()).toEqual(['/path/1', '/path/2']);
  });

  test('应删除 worktree', () => {
    manager.create('/path/to/worktree', 'branch');
    expect(manager.remove('/path/to/worktree')).toBe(true);
    expect(manager.list()).not.toContain('/path/to/worktree');
  });

  test('应获取 worktree 信息', () => {
    manager.create('/path/to/worktree', 'feature');
    const info = manager.get('/path/to/worktree');
    expect(info.branch).toBe('feature');
    expect(info.createdAt).toBeDefined();
  });
});
