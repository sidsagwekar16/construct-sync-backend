// Subcontractors routes

import { Router } from 'express';
import { SubcontractorsController } from './subcontractors.controller';
import { validateRequest } from '../../middlewares/validate-request';
import { authenticateToken } from '../../middlewares/auth';
import {
  createSubcontractorSchema,
  updateSubcontractorSchema,
  listSubcontractorsQuerySchema,
  subcontractorIdSchema,
  createContractSchema,
  updateContractSchema,
  listContractsQuerySchema,
  contractIdSchema,
  createPaymentSchema,
  paymentIdSchema,
} from './subcontractors.validator';

const router = Router();
const subcontractorsController = new SubcontractorsController();

// All routes require authentication
router.use(authenticateToken);

// ============================================
// SUBCONTRACTORS ROUTES
// ============================================

/**
 * @swagger
 * /api/subcontractors:
 *   get:
 *     tags:
 *       - Subcontractors
 *     summary: List all subcontractors
 *     description: Get a paginated list of subcontractors for the authenticated user's company
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
 *         description: Search term for subcontractor name, business name, or email
 *       - in: query
 *         name: trade
 *         schema:
 *           type: string
 *         description: Filter by trade (e.g., Electrical, Plumbing)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of subcontractors retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', subcontractorsController.listSubcontractors);

/**
 * @swagger
 * /api/subcontractors/{id}:
 *   get:
 *     tags:
 *       - Subcontractors
 *     summary: Get subcontractor by ID
 *     description: Get details of a specific subcontractor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Subcontractor ID
 *     responses:
 *       200:
 *         description: Subcontractor retrieved successfully
 *       404:
 *         description: Subcontractor not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', subcontractorsController.getSubcontractorById);

/**
 * @swagger
 * /api/subcontractors/{id}/stats:
 *   get:
 *     tags:
 *       - Subcontractors
 *     summary: Get subcontractor with statistics
 *     description: Get subcontractor details including active contracts count and total contract value
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Subcontractor ID
 *     responses:
 *       200:
 *         description: Subcontractor with stats retrieved successfully
 *       404:
 *         description: Subcontractor not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/stats', subcontractorsController.getSubcontractorWithStats);

/**
 * @swagger
 * /api/subcontractors:
 *   post:
 *     tags:
 *       - Subcontractors
 *     summary: Create a new subcontractor
 *     description: Create a new subcontractor for the authenticated user's company
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
 *                 example: ABC Electrical Contractors
 *               businessName:
 *                 type: string
 *                 maxLength: 255
 *                 example: ABC Electrical Pty Ltd
 *               abn:
 *                 type: string
 *                 maxLength: 50
 *                 example: 51 824 753 556
 *               email:
 *                 type: string
 *                 format: email
 *                 example: contact@abcelectrical.com
 *               phone:
 *                 type: string
 *                 example: +61 400 000 000
 *               address:
 *                 type: string
 *                 example: 123 Industrial Ave, Sydney NSW 2000
 *               trade:
 *                 type: string
 *                 example: Electrical
 *               description:
 *                 type: string
 *                 example: Licensed electrical contractor specializing in commercial projects
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Subcontractor created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  validateRequest(createSubcontractorSchema),
  subcontractorsController.createSubcontractor
);

/**
 * @swagger
 * /api/subcontractors/{id}:
 *   patch:
 *     tags:
 *       - Subcontractors
 *     summary: Update a subcontractor
 *     description: Update subcontractor details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Subcontractor ID
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
 *               businessName:
 *                 type: string
 *                 maxLength: 255
 *               abn:
 *                 type: string
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               trade:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Subcontractor updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Subcontractor not found
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/:id',
  validateRequest(updateSubcontractorSchema),
  subcontractorsController.updateSubcontractor
);

/**
 * @swagger
 * /api/subcontractors/{id}:
 *   delete:
 *     tags:
 *       - Subcontractors
 *     summary: Delete a subcontractor
 *     description: Soft delete a subcontractor (cannot delete if they have active contracts)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Subcontractor ID
 *     responses:
 *       200:
 *         description: Subcontractor deleted successfully
 *       400:
 *         description: Cannot delete subcontractor with active contracts
 *       404:
 *         description: Subcontractor not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', subcontractorsController.deleteSubcontractor);

// ============================================
// CONTRACTS ROUTES
// ============================================

/**
 * @swagger
 * /api/subcontractors/contracts:
 *   get:
 *     tags:
 *       - Subcontractor Contracts
 *     summary: List all contracts
 *     description: Get a paginated list of subcontractor contracts for the authenticated user's company
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in contract title, description, or contract number
 *       - in: query
 *         name: subcontractorId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by subcontractor
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by job
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, completed, terminated, expired]
 *         description: Filter by contract status
 *     responses:
 *       200:
 *         description: List of contracts retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/contracts', subcontractorsController.listContracts);

/**
 * @swagger
 * /api/subcontractors/contracts/{id}:
 *   get:
 *     tags:
 *       - Subcontractor Contracts
 *     summary: Get contract by ID
 *     description: Get details of a specific contract
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
 *         description: Contract retrieved successfully
 *       404:
 *         description: Contract not found
 *       401:
 *         description: Unauthorized
 */
router.get('/contracts/:id', subcontractorsController.getContractById);

/**
 * @swagger
 * /api/subcontractors/contracts/{id}/with-payments:
 *   get:
 *     tags:
 *       - Subcontractor Contracts
 *     summary: Get contract with payment details
 *     description: Get contract details including all payments, total paid, and remaining balance
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
 *         description: Contract with payments retrieved successfully
 *       404:
 *         description: Contract not found
 *       401:
 *         description: Unauthorized
 */
router.get('/contracts/:id/with-payments', subcontractorsController.getContractWithPayments);

/**
 * @swagger
 * /api/subcontractors/contracts:
 *   post:
 *     tags:
 *       - Subcontractor Contracts
 *     summary: Create a new contract
 *     description: Create a new contract with a subcontractor
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subcontractorId
 *               - title
 *             properties:
 *               subcontractorId:
 *                 type: string
 *                 format: uuid
 *               jobId:
 *                 type: string
 *                 format: uuid
 *               contractNumber:
 *                 type: string
 *                 example: SC-2024-001
 *               title:
 *                 type: string
 *                 example: Electrical Installation - Building A
 *               description:
 *                 type: string
 *               contractValue:
 *                 type: number
 *                 example: 50000.00
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-01-01
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-06-30
 *               status:
 *                 type: string
 *                 enum: [draft, active, completed, terminated, expired]
 *                 default: draft
 *               paymentTerms:
 *                 type: string
 *                 example: Net 30 days
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Contract created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Subcontractor not found
 */
router.post(
  '/contracts',
  validateRequest(createContractSchema),
  subcontractorsController.createContract
);

/**
 * @swagger
 * /api/subcontractors/contracts/{id}:
 *   patch:
 *     tags:
 *       - Subcontractor Contracts
 *     summary: Update a contract
 *     description: Update contract details including progress and status
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
 *             properties:
 *               jobId:
 *                 type: string
 *                 format: uuid
 *               contractNumber:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               contractValue:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               completionDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [draft, active, completed, terminated, expired]
 *               progressPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               paymentTerms:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contract updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Contract not found
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/contracts/:id',
  validateRequest(updateContractSchema),
  subcontractorsController.updateContract
);

/**
 * @swagger
 * /api/subcontractors/contracts/{id}:
 *   delete:
 *     tags:
 *       - Subcontractor Contracts
 *     summary: Delete a contract
 *     description: Soft delete a contract
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
 *         description: Contract deleted successfully
 *       404:
 *         description: Contract not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/contracts/:id', subcontractorsController.deleteContract);

// ============================================
// PAYMENTS ROUTES
// ============================================

/**
 * @swagger
 * /api/subcontractors/contracts/{contractId}/payments:
 *   get:
 *     tags:
 *       - Contract Payments
 *     summary: Get all payments for a contract
 *     description: Retrieve all payment records for a specific contract
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *       404:
 *         description: Contract not found
 *       401:
 *         description: Unauthorized
 */
router.get('/contracts/:contractId/payments', subcontractorsController.getPaymentsByContract);

/**
 * @swagger
 * /api/subcontractors/contracts/{contractId}/payments:
 *   post:
 *     tags:
 *       - Contract Payments
 *     summary: Create a payment
 *     description: Record a new payment for a contract
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contractId
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
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 10000.00
 *               paymentDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-02-01
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, check, bank_transfer, credit_card, eft, other]
 *                 example: bank_transfer
 *               referenceNumber:
 *                 type: string
 *                 example: TXN-2024-0001
 *               notes:
 *                 type: string
 *                 example: Progress payment - 20% completion
 *     responses:
 *       201:
 *         description: Payment created successfully
 *       400:
 *         description: Validation error or payment exceeds contract value
 *       404:
 *         description: Contract not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/contracts/:contractId/payments',
  validateRequest(createPaymentSchema),
  subcontractorsController.createPayment
);

/**
 * @swagger
 * /api/subcontractors/contracts/{contractId}/payments/{paymentId}:
 *   delete:
 *     tags:
 *       - Contract Payments
 *     summary: Delete a payment
 *     description: Delete a payment record from a contract
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment deleted successfully
 *       404:
 *         description: Contract or payment not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/contracts/:contractId/payments/:paymentId', subcontractorsController.deletePayment);

export default router;
