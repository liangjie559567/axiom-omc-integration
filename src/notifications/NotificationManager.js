class NotificationManager {
  constructor() {
    this.channels = new Map();
  }

  registerChannel(name, handler) {
    this.channels.set(name, handler);
  }

  async notify(channel, message) {
    const handler = this.channels.get(channel);
    if (!handler) return false;
    await handler(message);
    return true;
  }

  listChannels() {
    return Array.from(this.channels.keys());
  }
}

export default NotificationManager;
