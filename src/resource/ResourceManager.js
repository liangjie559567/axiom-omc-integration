class ResourceManager {
  constructor() {
    this.resources = new Map();
  }

  allocate(id, resource) {
    this.resources.set(id, { resource, allocated: true });
  }

  release(id) {
    const res = this.resources.get(id);
    if (res) res.allocated = false;
  }

  get(id) {
    return this.resources.get(id)?.resource;
  }
}

export default ResourceManager;
