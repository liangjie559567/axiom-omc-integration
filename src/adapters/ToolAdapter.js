class ToolAdapter {
  constructor() {
    this.tools = new Map();
  }

  register(name, tool) {
    this.tools.set(name, tool);
  }

  async execute(name, params) {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool not found: ${name}`);
    return await tool(params);
  }

  list() {
    return Array.from(this.tools.keys());
  }
}

export default ToolAdapter;
