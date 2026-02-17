/**
 * 读模型 - CQRS读端
 */
export class ReadModel {
  constructor() {
    this.data = new Map();
  }

  update(instanceId, state) {
    this.data.set(instanceId, state);
  }

  get(instanceId) {
    return this.data.get(instanceId);
  }
}
