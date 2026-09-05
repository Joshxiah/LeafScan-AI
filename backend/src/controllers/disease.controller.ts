/**
 * HTTP handler for the Disease Library.
 */

import { Request, Response } from 'express';
import * as diseaseService from '../services/disease.service';

/**
 * GET /api/diseases
 * PUBLIC - reference content shown in the mobile app's library.
 */
export async function listDiseases(req: Request, res: Response): Promise<void> {
  const diseases = await diseaseService.listDiseases();

  res.status(200).json({
    success: true,
    data: { diseases },
  });
}
