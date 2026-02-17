class ErrorDetector {
  constructor() {
    this.errors = [];
  }

  detect(operation, result) {
    if (result.error) {
      this.errors.push({ operation, error: result.error, timestamp: Date.now() });
      return true;
    }
    return false;
  }

  getErrors() {
    return this.errors;
  }

  clear() {
    this.errors = [];
  }
}

export default ErrorDetector;
