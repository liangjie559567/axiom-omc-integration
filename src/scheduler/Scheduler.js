class Scheduler {
  constructor() {
    this.tasks = new Map();
  }

  schedule(id, task) {
    this.tasks.set(id, { task, status: 'pending' });
  }

  execute(id) {
    const item = this.tasks.get(id);
    if (item) {
      item.status = 'completed';
      return item.task();
    }
  }

  cancel(id) {
    return this.tasks.delete(id);
  }

  getStatus(id) {
    return this.tasks.get(id)?.status;
  }
}

export default Scheduler;
