// Site Media Routes

import { Router } from 'express';
import { SiteMediaController } from './media.controller';
import { authenticateToken } from '../../../middlewares/auth';
import { validateRequest } from '../../../middlewares/validate-request';
import { uploadMediaSchema, mediaIdSchema } from './media.validator';

const router = Router({ mergeParams: true });
const mediaController = new SiteMediaController();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/sites/{siteId}/media:
 *   post:
 *     tags:
 *       - Site Media
 *     summary: Upload media for site
 *     description: Upload media (photo/video/document) to a site
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
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
router.post('/', validateRequest(uploadMediaSchema), mediaController.uploadMedia);

/**
 * @swagger
 * /api/sites/{siteId}/media:
 *   get:
 *     tags:
 *       - Site Media
 *     summary: Get site media
 *     description: Get all media for a site
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Media retrieved successfully
 */
router.get('/', mediaController.getSiteMedia);

/**
 * @swagger
 * /api/sites/{siteId}/media/{mediaId}:
 *   delete:
 *     tags:
 *       - Site Media
 *     summary: Delete site media
 *     description: Delete media from a site
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
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
router.delete('/:mediaId', validateRequest(mediaIdSchema), mediaController.deleteMedia);

export default router;



