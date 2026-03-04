import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma, ensurePrismaConnected } from "./prisma";
import bcrypt from "bcryptjs";
import authConfig from "@/auth.config";
import { cognitoSignIn, isCognitoConfigured } from "./cognito-auth";

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
if (!authSecret && process.env.NODE_ENV === "production") {
  throw new Error("SECURITY: AUTH_SECRET or NEXTAUTH_SECRET must be set in production");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);

        const invalidError = new Error("Invalid email or password.");

        try {
          await ensurePrismaConnected();
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (user?.password) {
            try {
              const isPasswordValid = await bcrypt.compare(password, user.password);
              if (isPasswordValid) {
                return {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  image: user.image,
                  role: user.role,
                };
              }
            } catch {
              // Invalid hash or compare error: fall through to generic error/Cognito
            }
          }

          if (isCognitoConfigured()) {
            const cognito = await cognitoSignIn({ email, password });
            if (cognito.ok) {
              return {
                id: cognito.email,
                email: cognito.email,
                name: cognito.name,
                image: null,
                role: "customer",
              };
            }
            console.warn("[AUTH] Cognito sign-in failed:", cognito.error);
            throw invalidError;
          }

          throw invalidError;
        } catch (err) {
          if (err instanceof Error && err.message !== invalidError.message) {
            console.error("[AUTH] Credentials authorize error:", err);
          }
          throw invalidError;
        }
      },
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
        const email = (token.email as string).toLowerCase();
        const name = (token.name as string | undefined) ?? null;

        await ensurePrismaConnected();
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

