import AgentRouter from '../agents/AgentRouter.js';

class TeamPipeline {
  constructor() {
    this.router = new AgentRouter();
    this.stages = ['team-plan', 'team-prd', 'team-exec', 'team-verify', 'team-fix'];
    this.currentStage = 'team-plan';
  }

  async executeStage(stage, context) {
    const agents = this.getStageAgents(stage);
    return { stage, agents, context };
  }

  getStageAgents(stage) {
    const map = {
      'team-plan': ['explore', 'planner'],
      'team-prd': ['analyst'],
      'team-exec': ['executor'],
      'team-verify': ['verifier'],
      'team-fix': ['debugger']
    };
    return map[stage] || [];
  }

  async transitionTo(nextStage) {
    if (this.stages.includes(nextStage)) {
      this.currentStage = nextStage;
      return true;
    }
    return false;
  }
}

export default TeamPipeline;
