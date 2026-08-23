import { NextResponse } from "next/server";
import { encryptJSON } from "./apiCrypto.server";

type RouteHandler = (request: Request, context?: unknown) => Promise<Response>;

/**
 * Wraps a Next.js App Router route handler so that its JSON response
 * is AES-256-CBC encrypted before being sent to the browser.
 *
 * Network tab will show:  { "_e": "<hex gibberish>" }
 * Actual response is transparently decrypted by FetchInterceptor on the client.
 */
export function withEncryption(handler: RouteHandler): RouteHandler {
  return async function encryptedHandler(
    request: Request,
    context?: unknown
  ): Promise<Response> {
    const response = await handler(request, context);

    // Bypass encryption if disabled via environment variable
    if (process.env.NEXT_PUBLIC_DISABLE_ENCRYPTION === "true") {
      return response;
    }

    // Try to parse the response body as JSON
    let data: unknown;
    try {
      const cloned = response.clone();
      data = await cloned.json();
    } catch {
      // Not JSON (e.g. plain text, redirect) — pass through unchanged
      return response;
    }

    const encrypted = encryptJSON(data);
    return NextResponse.json({ _e: encrypted }, { status: response.status });
  };
}
