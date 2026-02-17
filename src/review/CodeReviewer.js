class CodeReviewer {
  constructor() {
    this.reviews = new Map();
  }

  review(code, criteria) {
    const score = this.calculateScore(code, criteria);
    const review = { code, criteria, score, timestamp: Date.now() };
    this.reviews.set(code, review);
    return review;
  }

  calculateScore(code, criteria) {
    return criteria.length > 0 ? 80 : 0;
  }

  getReview(code) {
    return this.reviews.get(code);
  }

  list() {
    return Array.from(this.reviews.keys());
  }
}

export default CodeReviewer;
