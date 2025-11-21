// Validate request middleware

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../types/errors';

export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Try to validate with the new format first (body, params, query wrapper)
      const validated = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      
      // Update request with validated data
      if (validated.body !== undefined) req.body = validated.body;
      if (validated.params !== undefined) req.params = validated.params;
      if (validated.query !== undefined) req.query = validated.query;
      
      next();
    } catch (wrappedError) {
      // If new format fails, try the old format (direct validation)
      if (wrappedError instanceof ZodError) {
        try {
          const validated = await schema.parseAsync(req.body);
          req.body = validated;
          next();
        } catch (directError) {
          // Both formats failed, pass the error to error handler
          next(directError);
        }
      } else {
        next(wrappedError);
      }
    }
  };
};
