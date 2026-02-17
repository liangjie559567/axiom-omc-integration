class Notifier {
  constructor() {
    this.subscribers = new Map();
  }

  subscribe(channel, handler) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, []);
    }
    this.subscribers.get(channel).push(handler);
  }

  notify(channel, message) {
    const handlers = this.subscribers.get(channel);
    if (handlers) {
      handlers.forEach(h => h(message));
    }
  }
}

export default Notifier;
