class RollbackManager {
  constructor() {
    this.snapshots = [];
  }

  saveSnapshot(state) {
    this.snapshots.push({ state, timestamp: Date.now() });
  }

  rollback() {
    return this.snapshots.pop()?.state;
  }

  canRollback() {
    return this.snapshots.length > 0;
  }
}

export default RollbackManager;
