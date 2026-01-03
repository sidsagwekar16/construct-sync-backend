// Variations routes
import { Router } from 'express';
import { VariationsController } from './variations.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();
const controller = new VariationsController();

// All routes require authentication
router.use(authenticateToken);

router.get('/', controller.getAllVariations);
router.get('/:id', controller.getVariationById);
router.post('/', controller.createVariation);
router.put('/:id', controller.updateVariation);
router.delete('/:id', controller.deleteVariation);

export default router;








