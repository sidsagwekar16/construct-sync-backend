// Worker Profile Routes

import { Router } from 'express';
import { WorkerProfileController } from './profile.controller';

const router = Router();
const profileController = new WorkerProfileController();

/**
 * @swagger
 * /mobile/worker/profile/stats:
 *   get:
 *     tags:
 *       - Mobile Worker Profile
 *     summary: Get worker statistics
 *     description: Get statistics about worker's jobs, tasks, and incidents
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Worker statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', profileController.getStatistics);

/**
 * @swagger
 * /mobile/worker/profile:
 *   get:
 *     tags:
 *       - Mobile Worker Profile
 *     summary: Get worker profile
 *     description: Get authenticated worker's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Worker profile
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.get('/', profileController.getProfile);

/**
 * @swagger
 * /mobile/worker/profile:
 *   patch:
 *     tags:
 *       - Mobile Worker Profile
 *     summary: Update worker profile
 *     description: Update worker's profile information (limited fields)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.patch('/', profileController.updateProfile);

export default router;

