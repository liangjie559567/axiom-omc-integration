import { QueryHandler } from '../../../src/cqrs/QueryHandler.js';
import { ReadModel } from '../../../src/cqrs/ReadModel.js';

describe('QueryHandler', () => {
  let handler;
  let readModel;

  beforeEach(() => {
    readModel = new ReadModel();
    handler = new QueryHandler(readModel);
  });

  test('应该能够查询状态', () => {
    readModel.update('wf-1', { phase: 'running' });

    const state = handler.getState('wf-1');

    expect(state.phase).toBe('running');
  });
});
