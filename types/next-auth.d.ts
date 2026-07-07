import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "USER" | "ADMIN" | "BOT";
      verifyLevel: "NONE" | "SELF" | "VERIFIED";
      nickname?: string | null;
      isBanned?: boolean;
    };
  }
}
