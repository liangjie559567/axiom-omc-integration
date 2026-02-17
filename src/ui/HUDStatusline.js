class HUDStatusline {
  constructor() {
    this.status = {};
  }

  update(key, value) {
    this.status[key] = value;
  }

  get(key) {
    return this.status[key];
  }

  getAll() {
    return { ...this.status };
  }

  clear() {
    this.status = {};
  }
}

export default HUDStatusline;
