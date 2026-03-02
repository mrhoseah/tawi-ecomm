import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import CognitoProvider from "next-auth/providers/cognito";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
if (!authSecret && process.env.NODE_ENV === "production") {
  console.error("SECURITY: AUTH_SECRET or NEXTAUTH_SECRET must be set in production");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID || "",
      clientSecret: process.env.COGNITO_CLIENT_SECRET || "",
      issuer: process.env.COGNITO_ISSUER_URL,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours - refresh session daily
  },
  callbacks: {
    async jwt({ token, user }) {
      // When a user first signs in, NextAuth passes the user object (from
      // credentials, Google, Cognito, etc.). Ensure we always set token.email
      // so we can sync with our Prisma User record.
      if (user && user.email) {
        token.email = user.email;
        token.name = user.name ?? token.name;
      }

      // Keep app roles and user ids in our own database.
      if (token.email) {
        const email = token.email as string;
        const name = (token.name as string | undefined) ?? null;

        const dbUser = await prisma.user.upsert({
          where: { email },
          update: { name: name ?? undefined },
          create: {
            email,
            name,
            role: "customer",
          },
        });

        (token as any).id = dbUser.id;
        (token as any).role = dbUser.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
  secret: authSecret,
  trustHost: true,
});

