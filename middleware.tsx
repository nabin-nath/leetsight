// middleware.ts
import { auth } from "@/app/api/auth/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const session = await auth()

  if (!session && request.nextUrl.pathname !== "/signin") {
    return NextResponse.redirect(new URL("/signin", request.url))
  }

  if (session && request.nextUrl.pathname === "/signin") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/signin"], // Add more routes if needed
}
