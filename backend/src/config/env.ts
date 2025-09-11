import 'dotenv/config';

let Env = {
	PORT: process.env.PORT || 3001,
	DATABASE_URL: process.env.DATABASE_URL || 'postgresql://taskuser:taskpass@localhost:5432/daily_tasks',
	REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
	JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
	JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
	NODE_ENV: process.env.NODE_ENV || 'development',
	FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
	LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

export default Env;