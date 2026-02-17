class DataTransformer {
  constructor() {
    this.transformers = new Map();
  }

  register(type, transformer) {
    this.transformers.set(type, transformer);
  }

  transform(type, data) {
    const transformer = this.transformers.get(type);
    if (!transformer) return data;
    return transformer(data);
  }

  clear() {
    this.transformers.clear();
  }
}

export default DataTransformer;
