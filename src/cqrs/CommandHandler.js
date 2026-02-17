/**
 * 命令处理器 - CQRS写端
 */
export class CommandHandler {
  constructor(eventStore, eventBus) {
    this.eventStore = eventStore;
    this.eventBus = eventBus;
  }

  async execute(command) {
    const event = this._commandToEvent(command);
    const storedEvent = this.eventStore.append(event);
    await this.eventBus.publish(storedEvent);
    return storedEvent;
  }

  _commandToEvent(command) {
    return {
      type: command.type,
      instanceId: command.instanceId,
      data: command.data
    };
  }
}
