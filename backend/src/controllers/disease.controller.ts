/**
 * HTTP handler for the Disease Library.
 */

import { Request, Response } from 'express';
import * as diseaseService from '../services/disease.service';
import { ApiError } from '../utils/ApiError';
import { validate, updateDiseaseSchema } from '../utils/validation';

/**
 * GET /api/diseases?lang=en|ceb
 * PUBLIC - reference content shown in the mobile app's library.
 * `lang` selects the language of the text fields; anything other
 * than "ceb" is treated as English.
 */
export async function listDiseases(req: Request, res: Response): Promise<void> {
  const lang = req.query.lang === 'ceb' ? 'ceb' : 'en';
  const diseases = await diseaseService.listDiseases(lang);

  res.status(200).json({
    success: true,
    data: { diseases },
  });
}

/**
 * PATCH /api/diseases/:id
 * CAO admin only. Edits the reference content for one disease class.
 */
export async function updateDisease(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest('Invalid disease id');
  }

  const input = validate(updateDiseaseSchema, req.body);
  const disease = await diseaseService.updateDisease(id, input);

  res.status(200).json({
    success: true,
    message: 'Disease updated',
    data: { disease },
  });
}
