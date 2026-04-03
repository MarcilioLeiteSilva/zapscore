import { defineConfig, env } from "@prisma/config";

/**
 * Prisma 7 Configuration Mapping
 * Use a fallback URL to allow 'npx prisma generate' to pass during build time
 * without requiring the real DATABASE_URL secret (improves security).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL") || "postgresql://postgres:password@localhost:5432/zapscore",
  },
});
