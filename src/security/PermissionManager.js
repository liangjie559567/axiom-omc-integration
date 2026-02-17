class PermissionManager {
  constructor() {
    this.permissions = new Map();
  }

  grant(user, permission) {
    if (!this.permissions.has(user)) {
      this.permissions.set(user, new Set());
    }
    this.permissions.get(user).add(permission);
  }

  check(user, permission) {
    return this.permissions.get(user)?.has(permission) || false;
  }

  revoke(user, permission) {
    this.permissions.get(user)?.delete(permission);
  }
}

export default PermissionManager;
