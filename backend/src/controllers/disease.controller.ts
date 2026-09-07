/**
 * HTTP handler for the Disease Library.
 */

import { Request, Response } from 'express';
import * as diseaseService from '../services/disease.service';

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
