/**
 * PhaseMapper v2 - 事件驱动版本
 */
export class PhaseMapper {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.rules = new Map();
  }

  registerRule(rule) {
    const id = `${rule.from}-${Date.now()}`;
    this.rules.set(id, rule);
    return id;
  }

  async map(fromPhase, context = {}) {
    const results = [];

    for (const rule of this.rules.values()) {
      if (rule.from === fromPhase) {
        results.push(...rule.to);
      }
    }

    await this.eventBus.publish({
      type: 'PHASE_MAPPED',
      data: { fromPhase, results }
    });

    return results;
  }
}
