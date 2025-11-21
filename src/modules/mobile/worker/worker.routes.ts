// Worker Mobile API Main Router

import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth';
import { requireWorker } from '../../../middlewares/rbac';
import jobsRoutes from './jobs/jobs.routes';
import sitesRoutes from './sites/sites.routes';
import safetyRoutes from './safety/safety.routes';
import scheduleRoutes from './schedule/schedule.routes';
import profileRoutes from './profile/profile.routes';

const router = Router();

/**
 * Worker Mobile API Routes
 * All routes under /mobile/worker/* are specifically designed for worker mobile screens
 * These endpoints are secured with worker role authentication
 */

// Apply authentication and worker role check to all routes
router.use(authenticateToken, requireWorker);

// Jobs APIs
router.use('/jobs', jobsRoutes);

// Sites APIs
router.use('/sites', sitesRoutes);

// Safety APIs
router.use('/safety', safetyRoutes);

// Schedule APIs
router.use('/schedule', scheduleRoutes);

// Profile APIs
router.use('/profile', profileRoutes);

export default router;

