class TransactionManager {
  constructor() {
    this.transactions = new Map();
  }

  begin(id) {
    this.transactions.set(id, { status: 'active', operations: [] });
  }

  commit(id) {
    const tx = this.transactions.get(id);
    if (tx) tx.status = 'committed';
  }

  rollback(id) {
    const tx = this.transactions.get(id);
    if (tx) tx.status = 'rolled_back';
  }

  getStatus(id) {
    return this.transactions.get(id)?.status;
  }
}

export default TransactionManager;
