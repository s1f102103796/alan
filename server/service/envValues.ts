import dotenv from 'dotenv';
import z from 'zod';

dotenv.config();

const PORT = +z.string().parse(process.env.PORT);
const API_BASE_PATH = z.string().startsWith('/').parse(process.env.API_BASE_PATH);
const API_ORIGIN = z.string().url().parse(process.env.API_ORIGIN);
const CORS_ORIGIN = z.string().url().parse(process.env.CORS_ORIGIN);
const FIREBASE_AUTH_EMULATOR_HOST = z
  .string()
  .optional()
  .parse(process.env.FIREBASE_AUTH_EMULATOR_HOST);
const FIREBASE_SERVER_KEY = z.string().parse(process.env.FIREBASE_SERVER_KEY);
const S3_ENDPOINT = z.string().url().optional().parse(process.env.S3_ENDPOINT);
const S3_BUCKET = z.string().parse(process.env.S3_BUCKET);
const S3_ACCESS_KEY = z.string().parse(process.env.S3_ACCESS_KEY);
const S3_SECRET_KEY = z.string().parse(process.env.S3_SECRET_KEY);
const S3_REGION = z.string().parse(process.env.S3_REGION);
const OPENAI_KEY = z.string().parse(process.env.OPENAI_KEY);
const GITHUB_TEMPLATE = z.string().parse(process.env.GITHUB_TEMPLATE);
const GITHUB_OWNER = z.string().parse(process.env.GITHUB_OWNER);
const GITHUB_TOKEN = z.string().parse(process.env.GITHUB_TOKEN);
const RAILWAY_TOKEN = z.string().parse(process.env.RAILWAY_TOKEN);
const DISPLAY_ID_PREFIX = z.string().parse(process.env.DISPLAY_ID_PREFIX);
const SUB_DOMAIN_PREFIX = z.string().parse(process.env.SUB_DOMAIN_PREFIX);
const BASE_DOMAIN = z.string().parse(process.env.BASE_DOMAIN);

export {
  API_BASE_PATH,
  API_ORIGIN,
  BASE_DOMAIN,
  CORS_ORIGIN,
  DISPLAY_ID_PREFIX,
  FIREBASE_AUTH_EMULATOR_HOST,
  FIREBASE_SERVER_KEY,
  GITHUB_OWNER,
  GITHUB_TEMPLATE,
  GITHUB_TOKEN,
  OPENAI_KEY,
  PORT,
  RAILWAY_TOKEN,
  S3_ACCESS_KEY,
  S3_BUCKET,
  S3_ENDPOINT,
  S3_REGION,
  S3_SECRET_KEY,
  SUB_DOMAIN_PREFIX,
};
