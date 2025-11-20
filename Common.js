// prisma.config.cjs
module.exports = {
  schema: "prisma/schema.prisma",
  datasource: {
    provider: "sqlite",
    url: "file:./prisma/dev.db",
  },
  engine: "classic",
};