class SessionManager {
  constructor() {
    this.sessions = new Map();
  }

  create(id, data) {
    this.sessions.set(id, { data, created: Date.now() });
  }

  get(id) {
    return this.sessions.get(id);
  }

  destroy(id) {
    this.sessions.delete(id);
  }
}

export default SessionManager;
