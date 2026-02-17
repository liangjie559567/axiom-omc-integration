import AgentRouter from '../agents/AgentRouter.js';

class TeamCoordinator {
  constructor() {
    this.router = new AgentRouter();
    this.team = [];
  }

  addAgent(agentName) {
    const agent = { name: agentName };
    this.team.push(agent);
    return agent;
  }

  getTeam() {
    return this.team;
  }
}

export default TeamCoordinator;
