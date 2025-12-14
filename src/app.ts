import express, { Application } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { corsMiddleware } from './config/cors';
import { rateLimiter } from './config/rate-limit';
import { swaggerSpec } from './config/swagger';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import { logger } from './utils/logger';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import teamsRoutes from './modules/teams/teams.routes';
import sitesRoutes from './modules/sites/sites.routes';
import jobsRoutes from './modules/jobs/jobs.routes';
import tasksRoutes from './modules/tasks/tasks.routes';
import usersRoutes from './modules/users/users.routes';
import subcontractorsRoutes from './modules/subcontractors/subcontractors.routes';
import budgetsRoutes from './modules/budgets/budgets.routes';
import safetyRoutes from './modules/safety/safety.routes';
import mobileRoutes from './modules/mobile/mobile.routes';
import checkInsRoutes from './modules/check-ins/check-ins.routes';
import settingsRoutes from './modules/settings/settings.routes';

export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable for Swagger UI
    })
  );
  app.use(corsMiddleware);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting
  app.use(rateLimiter);

  /**
   * @swagger
   * /health:
   *   get:
   *     tags:
   *       - Health
   *     summary: Health check
   *     description: Check if the server is running
   *     responses:
   *       200:
   *         description: Server is running
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Server is running
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  });

  // Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'ConstructSync API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  }));

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/teams', teamsRoutes);
  app.use('/api/sites', sitesRoutes);
  app.use('/api/jobs', jobsRoutes);
  app.use('/api/tasks', tasksRoutes);
  app.use('/api/workers', usersRoutes);
  app.use('/api/subcontractors', subcontractorsRoutes);
  app.use('/api/budgets', budgetsRoutes);
  app.use('/api/safety', safetyRoutes);
  app.use('/api/check-ins', checkInsRoutes);
  app.use('/api/settings', settingsRoutes);
  
  // Mobile API routes
  app.use('/api/mobile', mobileRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  logger.info('Express app configured successfully');

  return app;
};

