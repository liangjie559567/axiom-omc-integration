class SyncCoordinator {
  constructor() {
    this.syncs = new Map();
  }

  register(id, handler) {
    this.syncs.set(id, { handler, status: 'idle' });
  }

  sync(id, data) {
    const sync = this.syncs.get(id);
    if (!sync) return null;
    sync.status = 'syncing';
    const result = sync.handler(data);
    sync.status = 'completed';
    return result;
  }

  getStatus(id) {
    return this.syncs.get(id)?.status;
  }
}

export default SyncCoordinator;
