// Mobile Sites Routes

import { Router } from 'express';
import { MobileSitesController } from './sites.controller';
import { authenticateToken } from '../../../middlewares/auth';

const router = Router();
const sitesController = new MobileSitesController();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /mobile/sites:
 *   get:
 *     tags:
 *       - Mobile Sites
 *     summary: List sites
 *     description: Get paginated list of sites with job/worker counts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planning, active, on_hold, completed, archived]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sites list retrieved successfully
 */
router.get('/', sitesController.listSites);

/**
 * @swagger
 * /mobile/sites/{id}:
 *   get:
 *     tags:
 *       - Mobile Sites
 *     summary: Get site details
 *     description: Get full details of a specific site
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Site details retrieved successfully
 *       404:
 *         description: Site not found
 */
router.get('/:id', sitesController.getSiteById);

/**
 * @swagger
 * /mobile/sites/{id}/jobs:
 *   get:
 *     tags:
 *       - Mobile Sites
 *     summary: Get site jobs
 *     description: Get all jobs at a specific site
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Jobs retrieved successfully
 */
router.get('/:id/jobs', sitesController.getSiteJobs);

/**
 * @swagger
 * /mobile/sites/{id}/workers:
 *   get:
 *     tags:
 *       - Mobile Sites
 *     summary: Get site workers
 *     description: Get all workers at a specific site
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Workers retrieved successfully
 */
router.get('/:id/workers', sitesController.getSiteWorkers);

export default router;


