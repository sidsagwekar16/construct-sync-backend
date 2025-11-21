// Mobile API Main Router

import { Router } from 'express';
import dashboardRoutes from './dashboard/dashboard.routes';
import jobsRoutes from './jobs/jobs.routes';
import sitesRoutes from './sites/sites.routes';
import safetyRoutes from './safety/safety.routes';
import workersRoutes from './workers/workers.routes';

const router = Router();

/**
 * Mobile API Routes
 * All routes under /mobile/* are specifically designed for mobile admin screens
 * These endpoints are optimized for mobile UI/UX and provide exactly the data needed
 */

// Dashboard APIs
router.use('/dashboard', dashboardRoutes);

// Jobs APIs
router.use('/jobs', jobsRoutes);

// Sites APIs
router.use('/sites', sitesRoutes);

// Safety APIs
router.use('/safety', safetyRoutes);

// Workers APIs
router.use('/workers', workersRoutes);

export default router;


