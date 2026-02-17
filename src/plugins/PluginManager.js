class PluginManager {
  constructor() {
    this.plugins = new Map();
  }

  load(name, plugin) {
    this.plugins.set(name, plugin);
  }

  unload(name) {
    return this.plugins.delete(name);
  }

  get(name) {
    return this.plugins.get(name);
  }

  list() {
    return Array.from(this.plugins.keys());
  }
}

export default PluginManager;
