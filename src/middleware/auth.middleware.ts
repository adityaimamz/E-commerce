import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const authMiddleware = auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  
  console.log("Middleware Debug:", {
    pathname,
    isLoggedIn,
    user: req.auth?.user
  });

  const isApiAuthRoute = pathname.startsWith("/api/auth");
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute = pathname.startsWith("/auth/login") || pathname.startsWith("/auth/register");
  
  if (isApiAuthRoute) return NextResponse.next();

  if (isAuthRoute) {
    if (isLoggedIn) {
      console.log("Redirecting logged in user away from auth route:", pathname);
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    return NextResponse.next();
  }

  if (isAdminRoute) {
    if (!isLoggedIn) {
      console.log("Redirecting unauthenticated user to login from admin route:", pathname);
      return NextResponse.redirect(new URL("/auth/login", req.nextUrl));
    }
    if (req.auth?.user?.role !== "ADMIN") {
      console.log("Redirecting non-admin user away from admin route:", pathname);
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }

  return NextResponse.next();
});
