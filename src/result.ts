interface IEither<R, E> {
  isOk(): this is Ok<R, E>;
  isErr(): this is Err<E, R>;
}

export class Ok<R, E> implements IEither<R, E> {
  readonly value: R;

  constructor(value: R) {
    this.value = value;
  }

  isOk(): this is Ok<R, E> {
    return true;
  }

  isErr(): this is Err<E, R> {
    return false;
  }
}

export class Err<E, R> implements IEither<R, E> {
  readonly error: E;

  constructor(error: E) {
    this.error = error;
  }

  isOk(): this is Ok<R, E> {
    return false;
  }

  isErr(): this is Err<E, R> {
    return true;
  }
}

export type Result<R, E> = Ok<R, E> | Err<E, R>;

export function ok<R>(value: R): Ok<R, never> {
  return new Ok(value);
}

export function err<E>(error: E): Err<E, never> {
  return new Err(error);
}
