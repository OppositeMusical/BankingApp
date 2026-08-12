import { NextResponse, type NextRequest } from "next/server";
import { apiConfig } from "@/lib/api/config";

/*
 * BFF proxy.  ReadMe.md §5.5
 *
 * The browser only ever talks to this route, same-origin. It attaches the
 * bearer token server-side from an httpOnly cookie, so no JavaScript in the
 * page can read a credential — that removes the XSS token-theft path rather
 * than mitigating it. It also means no CORS configuration, and the real
 * backend URL is never shipped to the client.
 *
 * `/auth/login` and `/auth/refresh` are special-cased: their token fields are
 * peeled out of the response and written as cookies, and only the user object
 * continues to the browser.
 */

const ACCESS_COOKIE = "ba_access";
const REFRESH_COOKIE = "ba_refresh";

/** Hop-by-hop headers, plus the ones we set ourselves. */
const STRIPPED = new Set([
  "host",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "cookie",
  "content-length",
]);

function upstreamUrl(path: string[], search: string) {
  const base = apiConfig.internalUrl.replace(/\/$/, "");
  return `${base}/${path.join("/")}${search}`;
}

function forwardHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!STRIPPED.has(key.toLowerCase())) headers.set(key, value);
  });

  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

const isAuthExchange = (path: string[]) =>
  path[0] === "auth" && (path[1] === "login" || path[1] === "refresh" || path[1] === "register");

async function proxy(request: NextRequest, path: string[]) {
  const url = upstreamUrl(path, request.nextUrl.search);

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: request.method,
      headers: forwardHeaders(request),
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.text(),
      // The proxy is the trust boundary; never let Next cache a money endpoint.
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "UPSTREAM_ERROR",
          message: "The banking service is not reachable.",
        },
        requestId: crypto.randomUUID(),
      },
      { status: 502 },
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  // Anything that isn't a token exchange passes straight through.
  if (!isAuthExchange(path) || !isJson || !upstream.ok) {
    const body = await upstream.text();
    const response = new NextResponse(body, {
      status: upstream.status,
      headers: { "content-type": contentType || "application/json" },
    });
    // A rejected token is a dead token — clear it so the next request is a
    // clean 401 rather than a retry loop with a credential that cannot work.
    if (upstream.status === 401) {
      response.cookies.delete(ACCESS_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);
    }
    return response;
  }

  const payload = (await upstream.json()) as {
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    user?: unknown;
  };

  // Only the user crosses back to the browser. The tokens stop here.
  const response = NextResponse.json(
    { user: payload.user },
    { status: upstream.status },
  );

  const secure = process.env.NODE_ENV === "production";
  if (payload.accessToken) {
    response.cookies.set(ACCESS_COOKIE, payload.accessToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: payload.expiresIn ?? 900,
    });
  }
  if (payload.refreshToken) {
    response.cookies.set(REFRESH_COOKIE, payload.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path);
}
export async function POST(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path);
}
export async function PATCH(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path);
}
export async function PUT(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path);
}
export async function DELETE(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path);
}
