// Site Memos Routes

import { Router } from 'express';
import { SiteMemosController } from './memos.controller';
import { authenticateToken } from '../../../middlewares/auth';
import { validateRequest } from '../../../middlewares/validate-request';
import { createMemoSchema, updateMemoSchema, memoIdSchema } from './memos.validator';

const router = Router({ mergeParams: true });
const memosController = new SiteMemosController();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/sites/{siteId}/memos:
 *   post:
 *     tags:
 *       - Site Memos
 *     summary: Create memo for site
 *     description: Create a new memo for a site
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
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Memo created successfully
 */
router.post('/', validateRequest(createMemoSchema), memosController.createMemo);

/**
 * @swagger
 * /api/sites/{siteId}/memos:
 *   get:
 *     tags:
 *       - Site Memos
 *     summary: Get site memos
 *     description: Get all memos for a site
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
 *         description: Memos retrieved successfully
 */
router.get('/', memosController.getSiteMemos);

/**
 * @swagger
 * /api/sites/{siteId}/memos/{memoId}:
 *   patch:
 *     tags:
 *       - Site Memos
 *     summary: Update site memo
 *     description: Update a memo for a site
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
 *                 maxLength: 255
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Memo updated successfully
 */
router.patch('/:memoId', validateRequest(updateMemoSchema), memosController.updateMemo);

/**
 * @swagger
 * /api/sites/{siteId}/memos/{memoId}:
 *   delete:
 *     tags:
 *       - Site Memos
 *     summary: Delete site memo
 *     description: Delete a memo from a site
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
 *         name: memoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Memo deleted successfully
 */
router.delete('/:memoId', validateRequest(memoIdSchema), memosController.deleteMemo);

export default router;



