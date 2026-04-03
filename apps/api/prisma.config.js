import { defineConfig } from "@prisma/config";

/**
 * Prisma 7 Configuration Mapping
 * Using process.env.DATABASE_URL to allow fallback for build-time generation
 * without using the stricter env() helper that can throw when missing.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/zapscore",
  },
});
