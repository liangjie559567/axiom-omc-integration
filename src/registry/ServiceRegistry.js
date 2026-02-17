class ServiceRegistry {
  constructor() {
    this.services = new Map();
  }

  register(name, service) {
    this.services.set(name, service);
  }

  get(name) {
    return this.services.get(name);
  }

  unregister(name) {
    this.services.delete(name);
  }
}

export default ServiceRegistry;
