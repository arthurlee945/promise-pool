export declare const ERROR_CODES_BY_KEY: {
    readonly BAD_REQUEST: 400;
    readonly PARSE_ERROR: 500;
    readonly NOT_IMPLEMENTED: 500;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly METHOD_NOT_SUPPORTED: 405;
    readonly TIMEOUT: 408;
    readonly CONFLICT: 409;
    readonly PRECONDITION_FAILED: 412;
    readonly PAYLOAD_TOO_LARGE: 413;
    readonly UNPROCESSABLE_CONTENT: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly CLIENT_CLOSED_REQUEST: 499;
};
export declare const ERROR_KEYS_BY_CODE: {
    readonly 400: "BAD_REQUEST";
    readonly 500: "INTERNAL_SERVER_ERROR";
    readonly 401: "UNAUTHORIZED";
    readonly 403: "FORBIDDEN";
    readonly 404: "NOT_FOUND";
    readonly 405: "METHOD_NOT_SUPPORTED";
    readonly 408: "TIMEOUT";
    readonly 409: "CONFLICT";
    readonly 412: "PRECONDITION_FAILED";
    readonly 413: "PAYLOAD_TOO_LARGE";
    readonly 422: "UNPROCESSABLE_CONTENT";
    readonly 429: "TOO_MANY_REQUESTS";
    readonly 499: "CLIENT_CLOSED_REQUEST";
};
export declare class QPPError extends Error {
    readonly cause?: Error;
    readonly code: keyof typeof ERROR_CODES_BY_KEY;
    readonly status: keyof typeof ERROR_KEYS_BY_CODE;
    constructor(opts: {
        message?: string;
        code?: keyof typeof ERROR_CODES_BY_KEY;
        status?: number;
        cause?: unknown;
    });
}
