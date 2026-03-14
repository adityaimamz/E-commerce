export { authMiddleware as default } from "@/middleware/auth.middleware";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};