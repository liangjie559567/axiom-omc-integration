import CodeReviewer from '../CodeReviewer.js';

describe('CodeReviewer', () => {
  let reviewer;

  beforeEach(() => {
    reviewer = new CodeReviewer();
  });

  test('应审查代码', () => {
    const result = reviewer.review('const x = 1;', ['quality']);
    expect(result.score).toBe(80);
    expect(result.code).toBe('const x = 1;');
  });

  test('应获取审查结果', () => {
    reviewer.review('const x = 1;', ['quality']);
    const result = reviewer.getReview('const x = 1;');
    expect(result).toBeDefined();
  });

  test('应列出所有审查', () => {
    reviewer.review('code1', ['quality']);
    reviewer.review('code2', ['style']);
    expect(reviewer.list()).toEqual(['code1', 'code2']);
  });
});
