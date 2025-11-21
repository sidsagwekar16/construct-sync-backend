// Mobile API Main Router

import { Router } from 'express';
import dashboardRoutes from './dashboard/dashboard.routes';
import jobsRoutes from './jobs/jobs.routes';
import sitesRoutes from './sites/sites.routes';
import safetyRoutes from './safety/safety.routes';
import workersRoutes from './workers/workers.routes';
import workerRoutes from './worker/worker.routes';

const router = Router();

/**
 * Mobile API Routes
 * All routes under /mobile/* are specifically designed for mobile screens
 * - /mobile/* routes are for admin/manager screens
 * - /mobile/worker/* routes are for worker screens with role-based access
 * These endpoints are optimized for mobile UI/UX and provide exactly the data needed
 */

// Worker-specific routes (requires worker role)
router.use('/worker', workerRoutes);

// Admin/Manager Dashboard APIs
router.use('/dashboard', dashboardRoutes);

// Admin/Manager Jobs APIs
router.use('/jobs', jobsRoutes);

// Admin/Manager Sites APIs
router.use('/sites', sitesRoutes);

// Admin/Manager Safety APIs
router.use('/safety', safetyRoutes);

// Admin/Manager Workers APIs
router.use('/workers', workersRoutes);

export default router;


