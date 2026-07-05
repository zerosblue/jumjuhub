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
          // 1) provider + providerAccountId로 기존 계정 조회 (이메일 없는 카카오 대응)
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            include: { user: true },
          });

          let dbUser = existingAccount?.user ?? null;

          // 2) account 없으면 이메일로 재시도
          if (!dbUser && email) {
            dbUser = await prisma.user.findUnique({ where: { email } }) ?? null;
          }

          if (!dbUser) {
            // 3) 신규 유저 + Account 레코드 생성
            dbUser = await prisma.user.create({
              data: {
                email: email ?? null,
                nickname: null,
                image: image ?? null,
                provider: account.provider,
                accounts: {
                  create: {
                    type: account.type,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    access_token: account.access_token,
                    refresh_token: account.refresh_token,
                    expires_at: account.expires_at,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token,
                  },
                },
              },
            });
          } else {
            // 4) 기존 유저 — Account 레코드 없으면 연결, 사진 업데이트
            if (!existingAccount) {
              await prisma.account.upsert({
                where: {
                  provider_providerAccountId: {
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                  },
                },
                create: {
                  userId: dbUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                },
                update: {},
              });
            }
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

      // 매번 DB에서 최신값 조회 (닉네임·사진 수정 후 JWT 캐시와 DB 동기화)
      if (token.id && !account) {
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
