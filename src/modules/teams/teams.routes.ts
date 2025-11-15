// Teams routes

import { Router } from 'express';
import { TeamsController } from './teams.controller';
import { validateRequest } from '../../middlewares/validate-request';
import { authenticateToken } from '../../middlewares/auth';
import {
  createTeamSchema,
  updateTeamSchema,
  addTeamMembersSchema,
  updateTeamMemberSchema,
  listTeamsQuerySchema,
  teamIdSchema,
} from './teams.validator';

const router = Router();
const teamsController = new TeamsController();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/teams:
 *   get:
 *     tags:
 *       - Teams
 *     summary: List all teams
 *     description: Get a paginated list of teams for the authenticated user's company
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
 *         description: Search term for team name or description
 *       - in: query
 *         name: includeMembers
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include member details in response
 *     responses:
 *       200:
 *         description: List of teams retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', teamsController.listTeams);

/**
 * @swagger
 * /api/teams/{id}:
 *   get:
 *     tags:
 *       - Teams
 *     summary: Get team by ID
 *     description: Get details of a specific team
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *       - in: query
 *         name: includeMembers
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include member details in response
 *     responses:
 *       200:
 *         description: Team retrieved successfully
 *       404:
 *         description: Team not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', teamsController.getTeamById);

/**
 * @swagger
 * /api/teams:
 *   post:
 *     tags:
 *       - Teams
 *     summary: Create a new team
 *     description: Create a new team for the authenticated user's company
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
 *                 example: Development Team
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: Team responsible for software development
 *               memberIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ["123e4567-e89b-12d3-a456-426614174000"]
 *               memberRoles:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                   enum: [lead, member, viewer]
 *                 example: {"123e4567-e89b-12d3-a456-426614174000": "lead"}
 *     responses:
 *       201:
 *         description: Team created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', validateRequest(createTeamSchema), teamsController.createTeam);

/**
 * @swagger
 * /api/teams/{id}:
 *   patch:
 *     tags:
 *       - Teams
 *     summary: Update a team
 *     description: Update team details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
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
 *                 example: Updated Team Name
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: Updated description
 *     responses:
 *       200:
 *         description: Team updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Team not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id', validateRequest(updateTeamSchema), teamsController.updateTeam);

/**
 * @swagger
 * /api/teams/{id}:
 *   delete:
 *     tags:
 *       - Teams
 *     summary: Delete a team
 *     description: Soft delete a team and all its members
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team deleted successfully
 *       404:
 *         description: Team not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', teamsController.deleteTeam);

/**
 * @swagger
 * /api/teams/{id}/members:
 *   get:
 *     tags:
 *       - Teams
 *     summary: Get team members
 *     description: Get all members of a specific team
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team members retrieved successfully
 *       404:
 *         description: Team not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/members', teamsController.getTeamMembers);

/**
 * @swagger
 * /api/teams/{id}/members:
 *   post:
 *     tags:
 *       - Teams
 *     summary: Add members to team
 *     description: Add one or more members to a team
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 50
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ["123e4567-e89b-12d3-a456-426614174000"]
 *               role:
 *                 type: string
 *                 enum: [lead, member, viewer]
 *                 default: member
 *                 example: member
 *     responses:
 *       201:
 *         description: Members added successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Team not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:id/members',
  validateRequest(addTeamMembersSchema),
  teamsController.addTeamMembers
);

/**
 * @swagger
 * /api/teams/{id}/members:
 *   patch:
 *     tags:
 *       - Teams
 *     summary: Update team member role
 *     description: Update the role of a team member
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - role
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               role:
 *                 type: string
 *                 enum: [lead, member, viewer]
 *                 example: lead
 *     responses:
 *       200:
 *         description: Member role updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Team or member not found
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/:id/members',
  validateRequest(updateTeamMemberSchema),
  teamsController.updateTeamMember
);

/**
 * @swagger
 * /api/teams/{id}/members/{userId}:
 *   delete:
 *     tags:
 *       - Teams
 *     summary: Remove team member
 *     description: Remove a member from a team
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       404:
 *         description: Team or member not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id/members/:userId', teamsController.removeTeamMember);

export default router;
