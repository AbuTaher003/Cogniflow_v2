import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return response;
  }

  // Set up Supabase server client for middleware cookie refresh and database query
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: Parameters<typeof response.cookies.set>[2] }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // 1. If not logged in
  if (!user) {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
      const redirectUrl = new URL("/sign-in", request.url);
      if (pathname.startsWith("/dashboard")) {
        redirectUrl.searchParams.set("next", pathname);
      }
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  // 2. If logged in
  // Fetch profile to check onboarding status
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  const isOnboarded = !!profile?.onboarding_completed;

  // Check routes
  if (pathname === "/sign-in" || pathname === "/sign-up") {
    return NextResponse.redirect(new URL(isOnboarded ? "/dashboard" : "/onboarding", request.url));
  }

  if (pathname.startsWith("/onboarding") && isOnboarded) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/dashboard") && !isOnboarded) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/sign-in",
    "/sign-up",
    "/auth/callback"
  ]
};