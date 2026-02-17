import fs from 'fs/promises';
import path from 'path';

class UnifiedMemoryManager {
  constructor(basePath = '.agent/memory') {
    this.basePath = basePath;
    this.contextPath = path.join(basePath, 'context.json');
  }

  async saveContext(agentId, context) {
    await fs.mkdir(this.basePath, { recursive: true });
    const data = await this._loadAll();
    data[agentId] = { ...context, timestamp: Date.now() };
    await fs.writeFile(this.contextPath, JSON.stringify(data, null, 2));
  }

  async loadContext(agentId) {
    const data = await this._loadAll();
    return data[agentId] || null;
  }

  async _loadAll() {
    try {
      const content = await fs.readFile(this.contextPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }
}

export default UnifiedMemoryManager;
