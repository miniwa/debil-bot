import { err, ok, Result } from "../src/result";
import { Assert } from "../src/misc/assert";

describe("Result<R, E>", () => {
  test("Should work with simple divide by zero example", () => {
    function divide(top: number, bottom: number): Result<number, Error> {
      if (bottom === 0) {
        return err(new Error("Divide by zero"));
      } else {
        return ok(top / bottom);
      }
    }

    const validDivide = divide(10, 5);
    expect(validDivide.isOk()).toBeTruthy();
    expect(validDivide.isErr()).toBeFalsy();
    Assert.checkCondition(validDivide.isOk());
    expect(validDivide.value).toBe(2);

    const byZero = divide(10, 0);
    expect(byZero.isOk()).toBeFalsy();
    expect(byZero.isErr()).toBeTruthy();
    Assert.checkCondition(byZero.isErr());
    expect(byZero.error.message).toBe("Divide by zero");
  });
});
