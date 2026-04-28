import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieSpec = { name: string; value: string; options?: CookieOptions };

export async function updateSession(request: NextRequest) {
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

  // Refresh tokens.
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
