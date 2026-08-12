import type { z } from "zod";
import { apiConfig } from "./config";
import {
  ApiError,
  ApiTimeoutError,
  ApiValidationError,
  ErrorEnvelopeSchema,
} from "./errors";

/*
 * The single fetch wrapper. Nothing else in the app calls fetch.
 *
 * Responsibilities, per ReadMe.md §5.2: base URL, headers, timeout, error
 * normalization, runtime validation, and retry policy. Two deliberate
 * departures from that section, both because the real backend differs from the
 * FastAPI it was written against:
 *
 *   - Errors are the Go envelope, not `{ detail }`. See errors.ts.
 *   - No case transform is applied. openapi.yaml is camelCase on the wire
 *     already, which is what §5.4's "decision (a)" was asking the backend for.
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type QueryValue = string | number | boolean | undefined | null;

export type ApiFetchOptions<T> = {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Validated against this before the value is returned. */
  schema?: z.ZodType<T>;
  signal?: AbortSignal;
  /**
   * Makes a mutation safe to replay. Sent as `Idempotency-Key`; the backend
   * replays the original response rather than acting twice.
   */
  idempotencyKey?: string;
  /** GET only. Retries transient failures with backoff. */
  retries?: number;
};

const RETRY_BASE_MS = 250;

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const base = apiConfig.baseUrl.replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/** Turns any non-2xx into an ApiError, whatever the body turned out to be. */
async function toApiError(response: Response): Promise<ApiError> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  const parsed = ErrorEnvelopeSchema.safeParse(payload);
  if (parsed.success) {
    return new ApiError({
      status: response.status,
      code: parsed.data.error.code,
      message: parsed.data.error.message,
      requestId: parsed.data.requestId,
      details: parsed.data.error.details,
    });
  }

  // Not our envelope — a proxy, a gateway, or an unhandled panic. Map by
  // status so callers can still branch on `code`.
  const byStatus: Record<number, ApiError["code"]> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "VALIDATION_FAILED",
    429: "RATE_LIMITED",
  };
  return new ApiError({
    status: response.status,
    code: byStatus[response.status] ?? (response.status >= 500 ? "INTERNAL" : "BAD_REQUEST"),
    message: response.statusText || `Request failed with status ${response.status}`,
  });
}

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions<T> = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    query,
    schema,
    signal,
    idempotencyKey,
    retries = method === "GET" ? 2 : 0,
  } = options;

  const url = buildUrl(path, query);
  let lastTransient: unknown;

  // Attempt 0 is the request itself; the rest are retries. Mutations get
  // `retries = 0` unless a caller opts in with an idempotency key, because
  // replaying a transfer is the one mistake this layer must never make.
  const attempts = method === "GET" || idempotencyKey ? retries : 0;

  for (let attempt = 0; attempt <= attempts; attempt++) {
    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), apiConfig.timeoutMs);

    // Caller cancellation and our timeout both have to abort the request.
    const onAbort = () => timeout.abort();
    signal?.addEventListener("abort", onAbort);

    try {
      const response = await fetch(url, {
        method,
        signal: timeout.signal,
        // The BFF proxy holds the token in an httpOnly cookie and attaches
        // Authorization server-side. Nothing here reads a credential.
        credentials: "include",
        headers: {
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
          ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await toApiError(response);
        if (error.isTransient && attempt < attempts) {
          lastTransient = error;
          await sleep(RETRY_BASE_MS * 2 ** attempt);
          continue;
        }
        throw error;
      }

      if (response.status === 204) return undefined as T;

      const payload = await response.json();
      if (!schema) return payload as T;

      const parsed = schema.safeParse(payload);
      if (!parsed.success) {
        throw new ApiValidationError(path, parsed.error.issues);
      }
      return parsed.data;
    } catch (error) {
      // Our own timeout fired, rather than the caller cancelling.
      if (
        error instanceof DOMException &&
        error.name === "AbortError" &&
        !signal?.aborted
      ) {
        const timeoutError = new ApiTimeoutError(path, apiConfig.timeoutMs);
        if (attempt < attempts) {
          lastTransient = timeoutError;
          await sleep(RETRY_BASE_MS * 2 ** attempt);
          continue;
        }
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  }

  throw lastTransient ?? new Error(`Request to ${path} failed`);
}
