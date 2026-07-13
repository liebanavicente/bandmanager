import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = Boolean(auth?.user);
      const publicPaths = ["/login", "/forgot-password"];

      if (publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
        if (isLoggedIn && pathname === "/login") {
          return Response.redirect(new URL("/", request.nextUrl));
        }
        return true;
      }

      if (pathname.startsWith("/api/auth")) return true;

      const protectedPaths = [
        "/",
        "/events",
        "/songs",
        "/repertoires",
        "/setlists",
        "/members",
        "/tasks",
        "/files",
        "/products",
        "/orders",
        "/settings",
      ];

      const isProtected = protectedPaths.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
      );

      if (isProtected && !isLoggedIn) {
        return false;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
};