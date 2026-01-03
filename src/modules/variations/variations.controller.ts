// Variations controller
import { Request, Response, NextFunction } from 'express';
import { VariationsService } from './variations.service';
import { createVariationSchema, updateVariationSchema } from './variations.validator';
import { AuthRequest } from '../../types/express';

export class VariationsController {
  private service: VariationsService;

  constructor() {
    this.service = new VariationsService();
  }

  getAllVariations = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const variations = await this.service.getAllVariations(userId);
      res.json(variations);
    } catch (error) {
      next(error);
    }
  };

  getVariationById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const variation = await this.service.getVariationById(id, userId);
      
      if (!variation) {
        return res.status(404).json({ error: 'Variation not found' });
      }

      res.json(variation);
    } catch (error) {
      next(error);
    }
  };

  createVariation = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { error, value } = createVariationSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const variation = await this.service.createVariation(value, userId);
      res.status(201).json(variation);
    } catch (error) {
      next(error);
    }
  };

  updateVariation = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { error, value } = updateVariationSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const variation = await this.service.updateVariation(id, value, userId);
      
      if (!variation) {
        return res.status(404).json({ error: 'Variation not found' });
      }

      res.json(variation);
    } catch (error) {
      next(error);
    }
  };

  deleteVariation = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const deleted = await this.service.deleteVariation(id, userId);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Variation not found' });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}








