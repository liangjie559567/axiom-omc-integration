class Logger {
  constructor() {
    this.logs = [];
  }

  log(level, message) {
    this.logs.push({ level, message, timestamp: Date.now() });
  }

  getLogs(level) {
    return level ? this.logs.filter(l => l.level === level) : this.logs;
  }

  clear() {
    this.logs = [];
  }
}

export default Logger;
