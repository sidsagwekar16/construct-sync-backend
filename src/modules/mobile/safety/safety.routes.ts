// Mobile Safety Routes

import { Router } from 'express';
import { MobileSafetyController } from './safety.controller';
import { authenticateToken } from '../../../middlewares/auth';

const router = Router();
const safetyController = new MobileSafetyController();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /mobile/safety/incidents/statistics:
 *   get:
 *     tags:
 *       - Mobile Safety
 *     summary: Get safety statistics
 *     description: Get incident counts by status and severity
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/incidents/statistics', safetyController.getStatistics);

/**
 * @swagger
 * /mobile/safety/incidents:
 *   get:
 *     tags:
 *       - Mobile Safety
 *     summary: List safety incidents
 *     description: Get paginated list of safety incidents with filtering
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
 *           enum: [open, investigating, resolved, closed]
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [minor, moderate, major, critical, fatal]
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: Incidents list retrieved successfully
 */
router.get('/incidents', safetyController.listIncidents);

/**
 * @swagger
 * /mobile/safety/incidents/{id}:
 *   get:
 *     tags:
 *       - Mobile Safety
 *     summary: Get incident details
 *     description: Get full details of a specific safety incident
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
 *         description: Incident details retrieved successfully
 *       404:
 *         description: Incident not found
 */
router.get('/incidents/:id', safetyController.getIncidentById);

/**
 * @swagger
 * /mobile/safety/incidents:
 *   post:
 *     tags:
 *       - Mobile Safety
 *     summary: Create safety incident
 *     description: Report a new safety incident
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *               - incidentDate
 *               - description
 *             properties:
 *               jobId:
 *                 type: string
 *                 format: uuid
 *               siteId:
 *                 type: string
 *                 format: uuid
 *               incidentDate:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [minor, moderate, major, critical, fatal]
 *               status:
 *                 type: string
 *                 enum: [open, investigating, resolved, closed]
 *     responses:
 *       201:
 *         description: Incident created successfully
 */
router.post('/incidents', safetyController.createIncident);

export default router;




