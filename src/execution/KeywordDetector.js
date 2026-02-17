class KeywordDetector {
  constructor() {
    this.keywords = {
      'autopilot': ['autopilot', 'build me', 'i want a'],
      'ralph': ['ralph', "don't stop", 'must complete'],
      'ultrawork': ['ulw', 'ultrawork'],
      'team': ['team', 'coordinated team']
    };
  }

  detect(text) {
    const lower = text.toLowerCase();
    for (const [mode, patterns] of Object.entries(this.keywords)) {
      for (const pattern of patterns) {
        if (lower.includes(pattern)) {
          return mode;
        }
      }
    }
    return null;
  }

  addKeyword(mode, keyword) {
    if (!this.keywords[mode]) this.keywords[mode] = [];
    this.keywords[mode].push(keyword);
  }
}

export default KeywordDetector;
