import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile, trigger }) {
      if (account && profile) {
        const email = profile.email as string | undefined;
        const image =
          (profile as any).picture ??
          (profile as any).image ??
          (profile as any).thumbnail_image_url ??
          null;

        try {
          let dbUser = email
            ? await prisma.user.findUnique({ where: { email } })
            : null;

          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: email ?? null,
                nickname: null,
                image: image ?? null,
                provider: account.provider,
              },
            });
          } else {
            dbUser = await prisma.user.update({
              where: { id: dbUser.id },
              data: { image: image ?? dbUser.image },
            });
          }

          token.id = dbUser.id;
          token.role = dbUser.role;
          token.verifyLevel = dbUser.verifyLevel;
          token.nickname = dbUser.nickname;
          token.isBanned = dbUser.isBanned;
          token.image = dbUser.image;
        } catch (e) {
          console.error("[auth] DB 유저 처리 실패:", e);
        }
      }

      // nickname이 없는 로그인 유저는 매번 DB에서 최신값 조회
      // (닉네임 설정 후 JWT 캐시와 DB가 어긋나는 문제 방지)
      if (token.id && !token.nickname && !account) {
        try {
          const fresh = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              nickname: true,
              role: true,
              verifyLevel: true,
              isBanned: true,
              image: true,
            },
          });
          if (fresh) Object.assign(token, fresh);
        } catch (e) {
          console.error("[auth] 닉네임 조회 실패:", e);
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
        session.user.image = (token.image as string) ?? session.user.image;
      }
      return session;
    },
  },
  pages: { signIn: "/auth/signin" },
});
