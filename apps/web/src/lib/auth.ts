import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        try {
          const res = await axios.post(`${API_URL}/api/v1/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          });
          const { user, accessToken, refreshToken } = res.data.data as {
            user: { id: string; email: string; name?: string; tier: string };
            accessToken: string;
            refreshToken: string;
          };
          return { ...user, accessToken, refreshToken };
        } catch {
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env["GOOGLE_CLIENT_ID"] ?? "",
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"] ?? "",
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token["accessToken"] = (user as { accessToken?: string }).accessToken;
        token["refreshToken"] = (
          user as { refreshToken?: string }
        ).refreshToken;
        token["tier"] = (user as { tier?: string }).tier;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token["accessToken"] as string;
      session.refreshToken = token["refreshToken"] as string;
      if (session.user) {
        session.user.tier = token["tier"] as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env["NEXTAUTH_SECRET"],
};

// Extend next-auth types
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      tier?: string;
    };
  }
}
