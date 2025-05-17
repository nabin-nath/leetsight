// middleware.ts
import { auth } from "@/app/api/auth/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth();
  // console.log("Session in middleware:", session);
  // If no session AND the current path is NOT the signin page, redirect to signin
  if (!session && request.nextUrl.pathname !== "/signin") {
    const signInUrl = new URL("/signin", request.nextUrl.origin);
    return NextResponse.redirect(signInUrl);
  }

  // If there IS a session AND the current path IS the signin page, redirect to home
  if (session && request.nextUrl.pathname === "/signin") {
    const homeUrl = new URL("/", request.nextUrl.origin);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Matcher should cover all protected routes and the signin page
  // It's generally good to also exclude API routes unless you specifically want middleware on them
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - unless you want auth on some Next.js API routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)", // More robust matcher
    // If you specifically want to protect / (home), /questions, /post/:path*, /signin:
    "/",
    "/signin",
    "/questions",
    "/post/:path*",
  ],
};
