class HUDStatusline {
  constructor() {
    this.status = { active: false, progress: 0 };
  }

  update(data) {
    this.status = { ...this.status, ...data, timestamp: Date.now() };
  }

  getStatus() {
    return this.status;
  }

  reset() {
    this.status = { active: false, progress: 0 };
  }
}

export default HUDStatusline;
