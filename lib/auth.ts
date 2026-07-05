import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? "USER";
        token.verifyLevel = (user as any).verifyLevel ?? "NONE";
        token.nickname = (user as any).nickname ?? null;
        token.isBanned = (user as any).isBanned ?? false;
      }
      // 세션 업데이트 시 (닉네임 변경 등)
      if (trigger === "update" && session) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { nickname: true, role: true, verifyLevel: true, isBanned: true },
        });
        if (fresh) {
          token.nickname = fresh.nickname;
          token.role = fresh.role;
          token.verifyLevel = fresh.verifyLevel;
          token.isBanned = fresh.isBanned;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.verifyLevel = token.verifyLevel as any;
        session.user.nickname = token.nickname as string | null;
        session.user.isBanned = token.isBanned as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});
