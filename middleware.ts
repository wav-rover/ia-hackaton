import NextAuth from "next-auth";
import { authConfig } from "@/server/auth.config";

// Edge-safe auth middleware. Uses the JWT session to gate routes via the
// `authorized` callback in auth.config.ts.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Run on everything except static assets and the auth API itself.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
