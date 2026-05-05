import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieSpec = { name: string; value: string; options?: CookieOptions };

/**
 * Middleware-side Supabase session refresh.
 *
 * BULLETPROOF CONTRACT: this function must never throw. If anything goes wrong
 * (missing env vars, malformed cookies, Supabase unreachable, library throws),
 * we fall through to a plain NextResponse.next() so the page can still render.
 * A 500'd middleware kills every route on the site, which is far worse than
 * occasionally treating a logged-in user as anonymous for one request.
 */
export async function updateSession(request: NextRequest) {
  try {
    return await updateSessionInner(request);
  } catch (err) {
    console.error("[middleware] fatal — falling through to anonymous:", err);
    return NextResponse.next({ request });
  }
}

async function updateSessionInner(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // If env vars are missing, skip auth refresh and let middleware short-circuit.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieSpec[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh tokens. Defensive: never let an auth-refresh error bubble up as a 500.
  // Stale cookies, network blips, or an unreachable Supabase project should not
  // take down the page — we just treat the visitor as anonymous.
  let user: { id: string } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user ?? null;
  } catch (err) {
    console.error("[middleware] supabase.auth.getUser failed:", err);
    user = null;
  }

  // Protect (app) routes.
  const url = request.nextUrl;
  const isProtected = url.pathname.startsWith("/dashboard");

  if (isProtected && !user) {
    const redirect = url.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", url.pathname);
    return NextResponse.redirect(redirect);
  }

  return supabaseResponse;
}
