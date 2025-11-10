export const configuration = () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    username: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'postgres',
    name: process.env.DATABASE_NAME ?? 'vid_learning',
    ssl:
      (process.env.DATABASE_SSL ?? '').toString().trim().toLowerCase() ===
      'true',
  },
  auth: {
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET ?? 'access-secret',
      refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
      accessTtl: parseInt(process.env.JWT_ACCESS_TTL ?? '3600', 10),
      refreshTtl: parseInt(process.env.JWT_REFRESH_TTL ?? '604800', 10),
    },
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10),
  },
  media: {
    bucket: process.env.VIDEO_STORAGE_BUCKET ?? 'video-learning-content',
    cdnBaseUrl: process.env.CDN_BASE_URL ?? '',
  },
});

export type AppConfig = ReturnType<typeof configuration>;
