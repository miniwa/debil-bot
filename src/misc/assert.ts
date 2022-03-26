class AssertionError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "AssertionError";
  }
}

export class Assert {
  static notNullOrUndefined<T>(param: T, name: string): asserts param {
    if (param === null || param === undefined) {
      throw new AssertionError(`Expected ${name} to not be null or undefined`);
    }
  }

  static checkCondition(condition: boolean, message?: string): asserts condition {
    if (!condition) {
      throw new AssertionError(message ?? "Expected condition to be true");
    }
  }
}
