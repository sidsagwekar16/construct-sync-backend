// Mobile Dashboard Routes

import { Router } from 'express';
import { MobileDashboardController } from './dashboard.controller';
import { authenticateToken } from '../../../middlewares/auth';

const router = Router();
const dashboardController = new MobileDashboardController();

// All dashboard routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /mobile/dashboard/metrics:
 *   get:
 *     tags:
 *       - Mobile Dashboard
 *     summary: Get dashboard metrics
 *     description: Get aggregated metrics for admin dashboard (active sites, jobs today, active workers, safety incidents)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     activeSites:
 *                       type: integer
 *                       example: 5
 *                     totalJobsToday:
 *                       type: integer
 *                       example: 12
 *                     activeWorkers:
 *                       type: integer
 *                       example: 45
 *                     safetyIncidents:
 *                       type: integer
 *                       example: 2
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/metrics', dashboardController.getMetrics);

/**
 * @swagger
 * /mobile/dashboard/activity:
 *   get:
 *     tags:
 *       - Mobile Dashboard
 *     summary: Get recent activity feed
 *     description: Get recent activity from jobs, tasks, and safety incidents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of activity items to return
 *     responses:
 *       200:
 *         description: Activity feed retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/activity', dashboardController.getActivity);

export default router;




