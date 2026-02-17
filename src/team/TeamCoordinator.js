import AgentRouter from '../agents/AgentRouter.js';

class TeamCoordinator {
  constructor() {
    this.router = new AgentRouter();
    this.team = [];
  }

  addAgent(agentName) {
    const agent = this.router.getAgent(agentName);
    if (agent) this.team.push(agent);
    return agent;
  }

  getTeam() {
    return this.team;
  }
}

export default TeamCoordinator;
