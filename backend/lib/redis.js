import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redis = null;
let redisConnected = false;

try {
  redis = new Redis(process.env.UPSTASH_REDIS_URL, {
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  })
    .on('connect', () => {
      console.log('Redis client connected');
      redisConnected = true;
    })
    .on('error', (err) => {
      console.error('Redis client error:', err);
      redisConnected = false;
    });
} catch (error) {
  console.error('Failed to initialize Redis:', error);
  redis = null;
}

// Helper functions to handle Redis operations with fallback
export const redisGet = async (key) => {
  if (!redis || !redisConnected) {
    console.warn('Redis not available, skipping get operation');
    return null;
  }
  try {
    return await redis.get(key);
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
};

export const redisSet = async (key, value, ...args) => {
  if (!redis || !redisConnected) {
    console.warn('Redis not available, skipping set operation');
    return 'OK';
  }
  try {
    return await redis.set(key, value, ...args);
  } catch (error) {
    console.error('Redis set error:', error);
    return 'OK';
  }
};

export const redisDel = async (key) => {
  if (!redis || !redisConnected) {
    console.warn('Redis not available, skipping del operation');
    return 1;
  }
  try {
    return await redis.del(key);
  } catch (error) {
    console.error('Redis del error:', error);
    return 1;
  }
};

export { redis };
