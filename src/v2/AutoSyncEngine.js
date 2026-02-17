/**
 * AutoSyncEngine v2 - 消息队列版本
 */
export class AutoSyncEngine {
  constructor(commandHandler) {
    this.commandHandler = commandHandler;
    this.queue = [];
  }

  async enqueue(syncTask) {
    this.queue.push(syncTask);
  }

  async process() {
    if (this.queue.length === 0) return;

    const task = this.queue.shift();
    await this.commandHandler.execute({
      type: 'SYNC_WORKFLOW',
      instanceId: task.target,
      data: { source: task.source }
    });
  }
}
