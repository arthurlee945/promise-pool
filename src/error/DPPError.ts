export const ERROR_CODES_BY_KEY = {
    BAD_REQUEST: 400,
    PARSE_ERROR: 500,
    NOT_IMPLEMENTED: 500,
    INTERNAL_SERVER_ERROR: 500,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_SUPPORTED: 405,
    TIMEOUT: 408,
    CONFLICT: 409,
    PRECONDITION_FAILED: 412,
    PAYLOAD_TOO_LARGE: 413,
    UNPROCESSABLE_CONTENT: 422,
    TOO_MANY_REQUESTS: 429,
    CLIENT_CLOSED_REQUEST: 499,
  } as const;
  
  export const ERROR_KEYS_BY_CODE = {
    400: "BAD_REQUEST",
    500: "INTERNAL_SERVER_ERROR",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_SUPPORTED",
    408: "TIMEOUT",
    409: "CONFLICT",
    412: "PRECONDITION_FAILED",
    413: "PAYLOAD_TOO_LARGE",
    422: "UNPROCESSABLE_CONTENT",
    429: "TOO_MANY_REQUESTS",
    499: "CLIENT_CLOSED_REQUEST",
  } as const;
  
  class UnknownCauseError extends Error {
    [key: string]: unknown;
  }
  
  function isObject(value: unknown): value is Record<string, unknown> {
    // check that value is object
    return !!value && !Array.isArray(value) && typeof value === "object";
  }
  
  function getCauseFromUnknown(cause: unknown): Error | undefined {
    if (cause instanceof Error) {
      return cause;
    }
  
    const type = typeof cause;
    if (type === "undefined" || type === "function" || cause === null) {
      return undefined;
    }
  
    // Primitive types just get wrapped in an error
    if (type !== "object") {
      return new Error(String(cause));
    }
  
    // If it's an object, we'll create a synthetic error
    if (isObject(cause)) {
      const err = new UnknownCauseError();
      for (const key in cause) {
        err[key] = cause[key];
      }
      return err;
    }
  
    return undefined;
  }
  export class DPPError extends Error {
    public readonly cause?: Error;
    public readonly code: keyof typeof ERROR_CODES_BY_KEY;
    public readonly status: keyof typeof ERROR_KEYS_BY_CODE;
  
    constructor(opts: { message?: string; code?: keyof typeof ERROR_CODES_BY_KEY; status?: number; cause?: unknown }) {
      const cause = getCauseFromUnknown(opts.cause);
      const message = opts.message ?? cause?.message ?? opts.code ?? "INTERNAL_SERVER_ERROR";
      super(message, { cause });
      const statusCode =
        opts.status && Object.values(ERROR_CODES_BY_KEY).includes(opts.status as keyof typeof ERROR_KEYS_BY_CODE)
          ? (opts.status as keyof typeof ERROR_KEYS_BY_CODE)
          : undefined;
      this.code = opts.code ?? ERROR_KEYS_BY_CODE[statusCode ?? 500] ?? "INTERNAL_SERVER_ERROR";
      this.status = statusCode ?? ERROR_CODES_BY_KEY[opts.code ?? "INTERNAL_SERVER_ERROR"] ?? 500;
      this.name = "KPError";
    }
  }
  