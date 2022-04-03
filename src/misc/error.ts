import { captureException } from "@sentry/node";

export function captureWithSerializedException(exception: any): string {
  return captureException(exception, {
    extra: {
      serializedException: exception,
    },
  });
}
