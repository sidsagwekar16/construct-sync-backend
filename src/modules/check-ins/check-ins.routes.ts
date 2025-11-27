// Check-ins routes

import { Router } from 'express';
import { CheckInsController } from './check-ins.controller';
import { validateRequest } from '../../middlewares/validate-request';
import { authenticateToken } from '../../middlewares/auth';
import {
  checkInSchema,
  checkOutSchema,
  listCheckInLogsSchema,
} from './check-ins.validator';

const router = Router();
const checkInsController = new CheckInsController();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/check-ins/check-in:
 *   post:
 *     tags:
 *       - Check-ins
 *     summary: Check in to a job
 *     description: Check in to a job to start tracking time
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - job_id
 *             properties:
 *               job_id:
 *                 type: string
 *                 format: uuid
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Checked in successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Already checked in
 */
router.post(
  '/check-in',
  validateRequest(checkInSchema),
  checkInsController.checkIn
);

/**
 * @swagger
 * /api/check-ins/check-out:
 *   post:
 *     tags:
 *       - Check-ins
 *     summary: Check out from current job
 *     description: Check out from the current job and calculate billable time
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checked out successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/check-out',
  validateRequest(checkOutSchema),
  checkInsController.checkOut
);

/**
 * @swagger
 * /api/check-ins/active:
 *   get:
 *     tags:
 *       - Check-ins
 *     summary: Get active check-in
 *     description: Get the current active check-in for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active check-in retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/active', checkInsController.getActiveCheckIn);

/**
 * @swagger
 * /api/check-ins/history:
 *   get:
 *     tags:
 *       - Check-ins
 *     summary: Get check-in history
 *     description: Get check-in history for the authenticated user
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
 *     responses:
 *       200:
 *         description: Check-in history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/history', checkInsController.getUserHistory);

/**
 * @swagger
 * /api/check-ins:
 *   get:
 *     tags:
 *       - Check-ins
 *     summary: List all check-ins
 *     description: List all check-in logs with filters (admin/manager view)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: job_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: active_only
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Check-in logs retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  validateRequest(listCheckInLogsSchema),
  checkInsController.listCheckIns
);

/**
 * @swagger
 * /api/check-ins/billables:
 *   get:
 *     tags:
 *       - Check-ins
 *     summary: Get billable hours
 *     description: Get total billable hours and amount for a user in a date range
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: start_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: end_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Billable hours retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/billables', checkInsController.getUserBillables);

export default router;
