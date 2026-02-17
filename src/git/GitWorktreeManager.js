class GitWorktreeManager {
  constructor() {
    this.worktrees = new Map();
  }

  create(path, branch) {
    this.worktrees.set(path, { branch, createdAt: Date.now() });
    return path;
  }

  list() {
    return Array.from(this.worktrees.keys());
  }

  remove(path) {
    return this.worktrees.delete(path);
  }

  get(path) {
    return this.worktrees.get(path);
  }
}

export default GitWorktreeManager;
