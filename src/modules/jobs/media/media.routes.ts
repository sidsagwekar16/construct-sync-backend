// Job Media Routes

import { Router } from 'express';
import { JobMediaController } from './media.controller';
import { authenticateToken } from '../../../middlewares/auth';
import { validateRequest } from '../../../middlewares/validate-request';
import {
  uploadPhotoSchema,
  uploadDocumentSchema,
  photoIdSchema,
  documentIdSchema,
} from './media.validator';

const router = Router({ mergeParams: true }); // mergeParams allows access to :jobId from parent router
const mediaController = new JobMediaController();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/jobs/{jobId}/media/photos:
 *   post:
 *     tags:
 *       - Job Media
 *     summary: Upload photo for job
 *     description: Upload a photo to a job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
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
 *               - photoUrl
 *             properties:
 *               photoUrl:
 *                 type: string
 *                 format: uri
 *               thumbnailUrl:
 *                 type: string
 *                 format: uri
 *               caption:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Photo uploaded successfully
 *       404:
 *         description: Job not found
 */
router.post('/photos', validateRequest(uploadPhotoSchema), mediaController.uploadPhoto);

/**
 * @swagger
 * /api/jobs/{jobId}/media/photos:
 *   get:
 *     tags:
 *       - Job Media
 *     summary: Get job photos
 *     description: Get all photos for a job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Photos retrieved successfully
 */
router.get('/photos', mediaController.getJobPhotos);

/**
 * @swagger
 * /api/jobs/{jobId}/media/photos/{photoId}:
 *   delete:
 *     tags:
 *       - Job Media
 *     summary: Delete job photo
 *     description: Delete a photo from a job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Photo deleted successfully
 */
router.delete('/photos/:photoId', validateRequest(photoIdSchema), mediaController.deletePhoto);

/**
 * @swagger
 * /api/jobs/{jobId}/media/documents:
 *   post:
 *     tags:
 *       - Job Media
 *     summary: Upload document for job
 *     description: Upload a document to a job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
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
 *               - documentName
 *               - documentUrl
 *             properties:
 *               documentName:
 *                 type: string
 *                 maxLength: 255
 *               documentUrl:
 *                 type: string
 *                 format: uri
 *               documentType:
 *                 type: string
 *                 enum: [blueprint, specification, contract, invoice, permit, inspection_report, safety_report, photo, video, other]
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 */
router.post('/documents', validateRequest(uploadDocumentSchema), mediaController.uploadDocument);

/**
 * @swagger
 * /api/jobs/{jobId}/media/documents:
 *   get:
 *     tags:
 *       - Job Media
 *     summary: Get job documents
 *     description: Get all documents for a job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 */
router.get('/documents', mediaController.getJobDocuments);

/**
 * @swagger
 * /api/jobs/{jobId}/media/documents/{documentId}:
 *   delete:
 *     tags:
 *       - Job Media
 *     summary: Delete job document
 *     description: Delete a document from a job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document deleted successfully
 */
router.delete('/documents/:documentId', validateRequest(documentIdSchema), mediaController.deleteDocument);

export default router;

