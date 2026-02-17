class CacheManager {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, ttl) {
    this.cache.set(key, { value, expires: ttl ? Date.now() + ttl : null });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

export default CacheManager;
