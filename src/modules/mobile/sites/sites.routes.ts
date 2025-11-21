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

/**
 * @swagger
 * /mobile/sites/{id}/media:
 *   post:
 *     tags:
 *       - Mobile Sites
 *     summary: Upload media for site
 *     description: Upload media (photo/video/document) to a site
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mediaUrl
 *             properties:
 *               mediaUrl:
 *                 type: string
 *                 format: uri
 *               thumbnailUrl:
 *                 type: string
 *                 format: uri
 *               mediaType:
 *                 type: string
 *                 enum: [photo, video, document, audio]
 *     responses:
 *       201:
 *         description: Media uploaded successfully
 */
router.post('/:id/media', sitesController.uploadMedia);

/**
 * @swagger
 * /mobile/sites/{id}/media/{mediaId}:
 *   delete:
 *     tags:
 *       - Mobile Sites
 *     summary: Delete site media
 *     description: Delete media from a site
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: mediaId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Media deleted successfully
 */
router.delete('/:id/media/:mediaId', sitesController.deleteMedia);

/**
 * @swagger
 * /mobile/sites/{id}/memos/{memoId}:
 *   patch:
 *     tags:
 *       - Mobile Sites
 *     summary: Update site memo
 *     description: Update a memo for a site
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: memoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Memo updated successfully
 */
router.patch('/:id/memos/:memoId', sitesController.updateMemo);

/**
 * @swagger
 * /mobile/sites/{id}/memos/{memoId}:
 *   delete:
 *     tags:
 *       - Mobile Sites
 *     summary: Delete site memo
 *     description: Delete a memo from a site
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: memoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Memo deleted successfully
 */
router.delete('/:id/memos/:memoId', sitesController.deleteMemo);

export default router;


