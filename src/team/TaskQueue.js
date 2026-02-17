class TaskQueue {
  constructor() {
    this.tasks = [];
  }

  add(task) {
    this.tasks.push({ ...task, status: 'pending' });
  }

  next() {
    return this.tasks.find(t => t.status === 'pending');
  }

  complete(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) task.status = 'completed';
  }
}

export default TaskQueue;
