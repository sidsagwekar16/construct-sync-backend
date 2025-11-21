// Worker Sites Routes

import { Router } from 'express';
import { WorkerSitesController } from './sites.controller';

const router = Router();
const sitesController = new WorkerSitesController();

/**
 * @swagger
 * /mobile/worker/sites:
 *   get:
 *     tags:
 *       - Mobile Worker Sites
 *     summary: List worker's sites
 *     description: Get all sites where the worker has assigned jobs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
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
 *         description: List of sites
 *       401:
 *         description: Unauthorized
 */
router.get('/', sitesController.listSites);

/**
 * @swagger
 * /mobile/worker/sites/{id}:
 *   get:
 *     tags:
 *       - Mobile Worker Sites
 *     summary: Get site details
 *     description: Get details of a site (only if worker has jobs there)
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
 *         description: Site details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Site not found or no access
 */
router.get('/:id', sitesController.getSiteById);

/**
 * @swagger
 * /mobile/worker/sites/{id}/jobs:
 *   get:
 *     tags:
 *       - Mobile Worker Sites
 *     summary: Get site jobs
 *     description: Get worker's jobs at a specific site
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
 *         description: List of jobs
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/:id/jobs', sitesController.getSiteJobs);

export default router;

