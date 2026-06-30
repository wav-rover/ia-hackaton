import type { NextAuthConfig } from "next-auth";
import type { Role } from "./roles";

/**
 * Edge-safe Auth.js configuration. This file must NOT import the database or
 * bcrypt so it can run in the middleware (edge) runtime. The Credentials
 * provider and Prisma adapter live in `auth.ts` (Node runtime).
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  // Providers are added in auth.ts; the middleware only needs to read the JWT.
  providers: [],
  session: { strategy: "jwt" },
  callbacks: {
    /** Route guard evaluated by the middleware. */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = nextUrl.pathname.startsWith("/account");
      if (isProtected) return isLoggedIn;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (typeof token.id === "string") session.user.id = token.id;
        session.user.role = token.role as Role | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
