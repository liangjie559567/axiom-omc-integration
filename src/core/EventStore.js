/**
 * 事件存储 - 核心实现
 */
export class EventStore {
  constructor() {
    this.events = [];
  }

  append(event) {
    const storedEvent = {
      ...event,
      timestamp: Date.now(),
      id: this._generateId()
    };
    this.events.push(storedEvent);
    return storedEvent;
  }

  getEvents(instanceId) {
    return this.events.filter(e => e.instanceId === instanceId);
  }

  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
