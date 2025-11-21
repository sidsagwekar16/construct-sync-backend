// Sites routes

import { Router } from 'express';
import { SitesController } from './sites.controller';
import { validateRequest } from '../../middlewares/validate-request';
import { authenticateToken } from '../../middlewares/auth';
import {
  createSiteSchema,
  updateSiteSchema,
  listSitesQuerySchema,
  siteIdSchema,
} from './sites.validator';
import mediaRoutes from './media/media.routes';
import memosRoutes from './memos/memos.routes';

const router = Router();
const sitesController = new SitesController();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/sites/statistics:
 *   get:
 *     tags:
 *       - Sites
 *     summary: Get site statistics
 *     description: Get statistics of sites by status for the authenticated user's company
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Site statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/statistics', sitesController.getSiteStatistics);

/**
 * @swagger
 * /api/sites:
 *   get:
 *     tags:
 *       - Sites
 *     summary: List all sites
 *     description: Get a paginated list of sites for the authenticated user's company
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for site name or address
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planning, active, on_hold, completed, archived]
 *         description: Filter by site status
 *     responses:
 *       200:
 *         description: List of sites retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', sitesController.listSites);

/**
 * @swagger
 * /api/sites/{id}:
 *   get:
 *     tags:
 *       - Sites
 *     summary: Get site by ID
 *     description: Get details of a specific site
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Site retrieved successfully
 *       404:
 *         description: Site not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', sitesController.getSiteById);

/**
 * @swagger
 * /api/sites:
 *   post:
 *     tags:
 *       - Sites
 *     summary: Create a new site
 *     description: Create a new site for the authenticated user's company
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 example: Construction Site A
 *               address:
 *                 type: string
 *                 maxLength: 1000
 *                 example: 123 Main Street, New York, NY 10001
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 example: 40.7128
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 example: -74.0060
 *               radius:
 *                 type: number
 *                 minimum: 50
 *                 maximum: 1000
 *                 example: 100
 *                 description: Geofence radius in meters (default 100m)
 *               status:
 *                 type: string
 *                 enum: [planning, active, on_hold, completed, archived]
 *                 default: planning
 *                 example: planning
 *     responses:
 *       201:
 *         description: Site created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', validateRequest(createSiteSchema), sitesController.createSite);

/**
 * @swagger
 * /api/sites/{id}:
 *   patch:
 *     tags:
 *       - Sites
 *     summary: Update a site
 *     description: Update site details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Site ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 example: Updated Site Name
 *               address:
 *                 type: string
 *                 maxLength: 1000
 *                 example: 456 New Avenue, Brooklyn, NY 11201
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 example: 40.6782
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 example: -73.9442
 *               radius:
 *                 type: number
 *                 minimum: 50
 *                 maximum: 1000
 *                 example: 150
 *                 description: Geofence radius in meters
 *               status:
 *                 type: string
 *                 enum: [planning, active, on_hold, completed, archived]
 *                 example: active
 *     responses:
 *       200:
 *         description: Site updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Site not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id', validateRequest(updateSiteSchema), sitesController.updateSite);

/**
 * @swagger
 * /api/sites/{id}:
 *   delete:
 *     tags:
 *       - Sites
 *     summary: Delete a site
 *     description: Soft delete a site (cannot delete sites with associated jobs)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Site deleted successfully
 *       400:
 *         description: Cannot delete site with associated jobs
 *       404:
 *         description: Site not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', sitesController.deleteSite);

// Mount media and memos routes under /:siteId
router.use('/:siteId/media', mediaRoutes);
router.use('/:siteId/memos', memosRoutes);

export default router;
