import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().allow('').default(''),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_SSL: Joi.boolean().truthy('true').falsy('false').default(false),
  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_TTL: Joi.number().min(60).default(3600),
  JWT_REFRESH_TTL: Joi.number().min(60).default(604800),
  BCRYPT_SALT_ROUNDS: Joi.number().min(4).default(12),
  VIDEO_STORAGE_BUCKET: Joi.string().required(),
  CDN_BASE_URL: Joi.string().allow('').default(''),
});
