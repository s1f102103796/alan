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
const TWITTER_USERNAME = process.env.TWITTER_USERNAME ?? '';
const TWITTER_PASSWORD = process.env.TWITTER_PASSWORD ?? '';
const OPENAIAPI = process.env.OPENAI_API ?? '';
const NEWSAPI = process.env.NEWS_API ?? '';
const GOURMETAPI = process.env.GOURMET_API ?? '';
const SBI_USER = z.string().parse(process.env.SBI_USER);
const SBI_PASS = z.string().parse(process.env.SBI_PASS);
const SBI_TRADE_PASS = z.string().parse(process.env.SBI_TRADE_PASS);

export {
  API_BASE_PATH,
  API_ORIGIN,
  CORS_ORIGIN,
  FIREBASE_AUTH_EMULATOR_HOST,
  FIREBASE_SERVER_KEY,
  GOURMETAPI,
  NEWSAPI,
  OPENAIAPI,
  PORT,
  S3_ACCESS_KEY,
  S3_BUCKET,
  S3_ENDPOINT,
  S3_REGION,
  S3_SECRET_KEY,
  SBI_PASS,
  SBI_TRADE_PASS,
  SBI_USER,
  TWITTER_PASSWORD,
  TWITTER_USERNAME,
};
