// Worker Safety Routes

import { Router } from 'express';
import { WorkerSafetyController } from './safety.controller';

const router = Router();
const safetyController = new WorkerSafetyController();

/**
 * @swagger
 * /mobile/worker/safety/incidents/statistics:
 *   get:
 *     tags:
 *       - Mobile Worker Safety
 *     summary: Get worker safety statistics
 *     description: Get statistics about safety incidents reported by worker
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Safety statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/incidents/statistics', safetyController.getStatistics);

/**
 * @swagger
 * /mobile/worker/safety/incidents:
 *   get:
 *     tags:
 *       - Mobile Worker Safety
 *     summary: List worker's safety incidents
 *     description: Get all safety incidents reported by the worker
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
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [minor, moderate, major, critical, fatal]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, investigating, resolved, closed]
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of safety incidents
 *       401:
 *         description: Unauthorized
 */
router.get('/incidents', safetyController.listIncidents);

/**
 * @swagger
 * /mobile/worker/safety/incidents/{id}:
 *   get:
 *     tags:
 *       - Mobile Worker Safety
 *     summary: Get incident details
 *     description: Get details of a safety incident (only if reported by worker)
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
 *         description: Incident details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Incident not found
 */
router.get('/incidents/:id', safetyController.getIncidentById);

/**
 * @swagger
 * /mobile/worker/safety/incidents:
 *   post:
 *     tags:
 *       - Mobile Worker Safety
 *     summary: Report new safety incident
 *     description: Report a new safety incident for an assigned job
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
 *               incidentDate:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [minor, moderate, major, critical, fatal]
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Incident reported successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/incidents', safetyController.createIncident);

export default router;



