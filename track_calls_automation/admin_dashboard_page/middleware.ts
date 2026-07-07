import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// NOTE: Middleware runs in Edge Runtime - cannot use Firebase Admin SDK or Node APIs.
// Maintenance check is handled at the page/layout level (Server Components) instead.
// We inject the current request URL path in the headers so that layout.tsx can access it reliably.
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
