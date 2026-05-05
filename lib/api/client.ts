const BASE_URL = "https://whisperbox.koyeb.app";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Map HTTP status codes to plain English messages the user can understand.
 * If the server provided a descriptive message we use that instead, unless
 * it looks like a raw internal error (starts with "HTTP " or is very short).
 */
function friendlyMessage(status: number, serverMessage: string): string {
  const serverIsUseful =
    serverMessage &&
    !serverMessage.startsWith("HTTP ") &&
    serverMessage.length > 4;

  if (serverIsUseful) return serverMessage;

  switch (status) {
    case 400:
      return "The request contained invalid information. Please check what you entered.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to do that.";
    case 404:
      return "The requested resource could not be found.";
    case 409:
      return "That username is already taken. Please choose a different one.";
    case 422:
      return "Some of the information you entered is invalid. Please review and try again.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
      return "The server encountered an unexpected error. Please try again later.";
    case 503:
      return "The service is temporarily unavailable. Please try again in a few moments.";
    default:
      return `An unexpected error occurred (status ${status}). Please try again.`;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
    });
  } catch {
    throw new ApiError(
      0,
      "Unable to reach the server. Please check your internet connection and try again."
    );
  }

  if (!res.ok) {
    let serverMessage = "";
    try {
      const body = await res.json();
      serverMessage = body.detail ?? body.message ?? "";
    } catch {
      // ignore parse errors on error responses
    }
    throw new ApiError(res.status, friendlyMessage(res.status, serverMessage));
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export const api = {
  get: <T>(path: string, token?: string) =>
    request<T>(path, { method: "GET" }, token),

  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }, token),
};
