import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export const redis = new Redis(process.env.UPSTASH_REDIS_URL)
  .on('connect', () => console.log('Redis client connected'))
  .on('error', (err) => console.error('Redis client error:', err));
