const { defineConfig } = require("@prisma/config");

/**
 * Prisma 7 Configuration Mapping (CommonJS for Runtime Compatibility)
 * Correctly exports for Node.js in CommonJS mode (no type:module in package.json).
 */
module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/zapscore",
  },
});
