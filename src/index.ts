import { createApp } from './app';
import { env } from './config/env';
import { db } from './db/connection';
import { logger } from './utils/logger';

const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(env.server.port, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 ConstructSync Backend Server                    ║
║                                                       ║
║   Environment: ${env.server.nodeEnv.toUpperCase().padEnd(36)}    ║
║   Port:        ${String(env.server.port).padEnd(36)}    ║
║   Database:    Connected ✅                           ║
║                                                       ║
║   API:         http://localhost:${env.server.port}/api           ║
║   Health:      http://localhost:${env.server.port}/health        ║
║   Swagger:     http://localhost:${env.server.port}/api-docs      ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      server.close(async () => {
        await db.close();
        logger.info('Server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();

