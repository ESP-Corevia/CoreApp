import pino from 'pino';

import { env } from '../env';
const isProd = env.NODE_ENV === 'production';

export const logger = pino({
  level: env.LOG_LEVEL || 'info',
  transport: !isProd
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          levelFirst: true,
        },
      }
    : undefined,
});

export default logger;
