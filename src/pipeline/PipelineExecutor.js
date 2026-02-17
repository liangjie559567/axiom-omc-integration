class PipelineExecutor {
  constructor() {
    this.pipelines = new Map();
  }

  register(id, stages) {
    this.pipelines.set(id, { stages, results: [] });
  }

  async execute(id, input) {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) return null;
    let result = input;
    for (const stage of pipeline.stages) {
      result = await stage(result);
      pipeline.results.push(result);
    }
    return result;
  }

  getResults(id) {
    return this.pipelines.get(id)?.results || [];
  }
}

export default PipelineExecutor;
