import PermissionManager from '../PermissionManager.js';

describe('PermissionManager', () => {
  let manager;

  beforeEach(() => {
    manager = new PermissionManager();
  });

  test('应授予和检查权限', () => {
    manager.grant('user1', 'read');
    expect(manager.check('user1', 'read')).toBe(true);
    expect(manager.check('user1', 'write')).toBe(false);
  });

  test('应撤销权限', () => {
    manager.grant('user1', 'read');
    manager.revoke('user1', 'read');
    expect(manager.check('user1', 'read')).toBe(false);
  });
});
