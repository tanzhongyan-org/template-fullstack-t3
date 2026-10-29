/**
 * JSON request logging. Every line carries a requestId; error responses return
 * it so the caller can find the matching line. Never log PII, tokens or OTPs.
 */

export interface LogFields {
  requestId: string;
  event: string;
  durationMs?: number;
  status?: number;
  [key: string]: unknown;
}

const write = (level: "info" | "error", fields: LogFields): void => {
  const line = JSON.stringify({ level, time: new Date().toISOString(), ...fields });
  if (level === "error") {
    console.error(line);
  } else {
    console.info(line);
  }
};

export const logRequest = (fields: LogFields): void => write("info", fields);

export const logError = (fields: LogFields & { error: string }): void => write("error", fields);

/** Read the request id the proxy sets, or mint one when it is missing. */
export const requestIdFrom = (headers: Headers): string =>
  headers.get("x-request-id") ?? crypto.randomUUID();
