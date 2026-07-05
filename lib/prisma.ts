import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// PgBouncer transaction mode doesn't support named prepared statements.
// Subclass Client to force prepareThreshold=0 (never auto-prepare).
class NoPrepareClient extends pg.Client {
  constructor(config: any) {
    super(config);
    (this as any).prepareThreshold = 0;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL!,
    // @ts-expect-error – valid pg Pool option, absent from @types/pg
    Client: NoPrepareClient,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
