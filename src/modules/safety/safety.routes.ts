// Safety routes

import { Router } from 'express';
import { SafetyController } from './safety.controller';
import { validateRequest } from '../../middlewares/validate-request';
import { authenticateToken } from '../../middlewares/auth';
import {
  createSafetyIncidentSchema,
  updateSafetyIncidentSchema,
  listSafetyIncidentsQuerySchema,
} from './safety.validator';

const router = Router();
const safetyController = new SafetyController();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/safety/incidents/statistics:
 *   get:
 *     tags:
 *       - Safety
 *     summary: Get safety incident statistics
 *     description: Get statistics of safety incidents by status and severity for the authenticated user's company
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Safety incident statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     byStatus:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       example:
 *                         open: 5
 *                         investigating: 3
 *                         resolved: 10
 *                         closed: 15
 *                     bySeverity:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       example:
 *                         minor: 12
 *                         moderate: 8
 *                         major: 5
 *                         critical: 2
 *                         fatal: 0
 *                     total:
 *                       type: integer
 *                       example: 33
 *       401:
 *         description: Unauthorized
 */
router.get('/incidents/statistics', safetyController.getStatistics);

/**
 * @swagger
 * /api/safety/incidents:
 *   get:
 *     tags:
 *       - Safety
 *     summary: List all safety incidents
 *     description: Get a paginated list of safety incidents for the authenticated user's company
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
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for incident description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, investigating, resolved, closed]
 *         description: Filter by incident status
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [minor, moderate, major, critical, fatal]
 *         description: Filter by severity level
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by job ID
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by site ID
 *       - in: query
 *         name: reportedBy
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by reporter user ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter incidents from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter incidents until this date
 *     responses:
 *       200:
 *         description: List of safety incidents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     incidents:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/incidents', safetyController.listIncidents);

/**
 * @swagger
 * /api/safety/incidents/{id}:
 *   get:
 *     tags:
 *       - Safety
 *     summary: Get safety incident by ID
 *     description: Get details of a specific safety incident with populated relationships
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Safety incident ID
 *     responses:
 *       200:
 *         description: Safety incident retrieved successfully
 *       404:
 *         description: Safety incident not found
 *       401:
 *         description: Unauthorized
 */
router.get('/incidents/:id', safetyController.getIncidentById);

/**
 * @swagger
 * /api/safety/incidents:
 *   post:
 *     tags:
 *       - Safety
 *     summary: Create a new safety incident
 *     description: Create a new safety incident report for the authenticated user's company
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - incidentDate
 *               - description
 *             properties:
 *               jobId:
 *                 type: string
 *                 format: uuid
 *                 description: Job ID where the incident occurred (required if siteId not provided)
 *               siteId:
 *                 type: string
 *                 format: uuid
 *                 description: Site ID where the incident occurred (required if jobId not provided)
 *               incidentDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T10:30:00Z"
 *                 description: Date and time when the incident occurred
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *                 example: "Worker slipped on wet floor, no injuries reported"
 *                 description: Detailed description of the incident
 *               severity:
 *                 type: string
 *                 enum: [minor, moderate, major, critical, fatal]
 *                 example: minor
 *                 description: Severity level of the incident
 *               status:
 *                 type: string
 *                 enum: [open, investigating, resolved, closed]
 *                 default: open
 *                 example: open
 *                 description: Current status of the incident
 *     responses:
 *       201:
 *         description: Safety incident created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/incidents', validateRequest(createSafetyIncidentSchema), safetyController.createIncident);

/**
 * @swagger
 * /api/safety/incidents/{id}:
 *   patch:
 *     tags:
 *       - Safety
 *     summary: Update a safety incident
 *     description: Update safety incident details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Safety incident ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Job ID where the incident occurred
 *               siteId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Site ID where the incident occurred
 *               incidentDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T10:30:00Z"
 *                 description: Date and time when the incident occurred
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *                 example: "Updated: Worker slipped on wet floor, received first aid"
 *                 description: Detailed description of the incident
 *               severity:
 *                 type: string
 *                 enum: [minor, moderate, major, critical, fatal]
 *                 nullable: true
 *                 example: moderate
 *                 description: Severity level of the incident
 *               status:
 *                 type: string
 *                 enum: [open, investigating, resolved, closed]
 *                 nullable: true
 *                 example: investigating
 *                 description: Current status of the incident
 *     responses:
 *       200:
 *         description: Safety incident updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Safety incident not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/incidents/:id', validateRequest(updateSafetyIncidentSchema), safetyController.updateIncident);

/**
 * @swagger
 * /api/safety/incidents/{id}:
 *   delete:
 *     tags:
 *       - Safety
 *     summary: Delete a safety incident
 *     description: Soft delete a safety incident (sets deleted_at timestamp)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Safety incident ID
 *     responses:
 *       200:
 *         description: Safety incident deleted successfully
 *       404:
 *         description: Safety incident not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/incidents/:id', safetyController.deleteIncident);

export default router;
