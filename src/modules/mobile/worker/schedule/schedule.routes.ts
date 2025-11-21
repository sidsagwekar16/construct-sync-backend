// Worker Schedule Routes

import { Router } from 'express';
import { WorkerScheduleController } from './schedule.controller';

const router = Router();
const scheduleController = new WorkerScheduleController();

/**
 * @swagger
 * /mobile/worker/schedule/today:
 *   get:
 *     tags:
 *       - Mobile Worker Schedule
 *     summary: Get today's jobs
 *     description: Get all jobs assigned to worker for today
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's jobs
 *       401:
 *         description: Unauthorized
 */
router.get('/today', scheduleController.getTodaysJobs);

/**
 * @swagger
 * /mobile/worker/schedule/week:
 *   get:
 *     tags:
 *       - Mobile Worker Schedule
 *     summary: Get this week's jobs
 *     description: Get all jobs assigned to worker for this week
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: This week's jobs
 *       401:
 *         description: Unauthorized
 */
router.get('/week', scheduleController.getWeeksJobs);

/**
 * @swagger
 * /mobile/worker/schedule:
 *   get:
 *     tags:
 *       - Mobile Worker Schedule
 *     summary: Get worker's schedule
 *     description: Get jobs assigned to worker within a date range
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Schedule with jobs
 *       401:
 *         description: Unauthorized
 */
router.get('/', scheduleController.getSchedule);

export default router;

