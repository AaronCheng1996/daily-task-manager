import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import moment from 'moment-timezone';
import morgan from 'morgan';

import { initDatabase } from './config/database';
import Env from './config/env';
import { initRedis } from './config/redis';
import router from './route';
import logger from './utils/logger';
import { TaskService } from './services/taskService';

dotenv.config();

const app = express();
const PORT = Env.PORT;

const limiter = rateLimit({
  windowMs: moment.duration(1, 'minutes').asMilliseconds(),
  max: 100,
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(cors({
  origin: Env.FRONTEND_URL,
  credentials: true
}));
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api', router);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err.stack);
  res.status(500).json({ 
    error: err.message //'Internal server error' change when release
  });
});

app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const startServer = async () => {
  try {
    await initDatabase();
    await initRedis();
    await TaskService.initializeTaskOrderIndex();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
