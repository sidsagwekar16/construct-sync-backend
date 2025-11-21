// Mobile Workers Routes

import { Router } from 'express';
import { MobileWorkersController } from './workers.controller';
import { authenticateToken } from '../../../middlewares/auth';

const router = Router();
const workersController = new MobileWorkersController();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /mobile/workers:
 *   get:
 *     tags:
 *       - Mobile Workers
 *     summary: List workers
 *     description: Get list of workers for assignment dropdowns
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [worker, foreman, site_supervisor]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workers list retrieved successfully
 */
router.get('/', workersController.listWorkers);

export default router;


