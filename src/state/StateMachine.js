class StateMachine {
  constructor(initial) {
    this.state = initial;
    this.transitions = new Map();
  }

  addTransition(from, to) {
    if (!this.transitions.has(from)) {
      this.transitions.set(from, []);
    }
    this.transitions.get(from).push(to);
  }

  transition(to) {
    const allowed = this.transitions.get(this.state);
    if (allowed && allowed.includes(to)) {
      this.state = to;
      return true;
    }
    return false;
  }

  getState() {
    return this.state;
  }
}

export default StateMachine;
