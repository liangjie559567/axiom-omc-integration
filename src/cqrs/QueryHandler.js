/**
 * 查询处理器 - CQRS读端
 */
export class QueryHandler {
  constructor(readModel) {
    this.readModel = readModel;
  }

  getState(instanceId) {
    return this.readModel.get(instanceId);
  }
}
