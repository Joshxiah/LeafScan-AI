/**
 * Notification routes for LeafScan AI.
 *
 * Mounted at /api/notifications in app.ts. Works for BOTH roles -
 * the CAO's dashboard inbox and a farmer's in-app inbox read the
 * same endpoints, each scoped to their own token.
 */

import { Router } from 'express';

import * as notificationController from '../controllers/notification.controller';
import { authenticate, authenticateStream } from '../middleware/auth.middleware';

const router = Router();

/** Real-time stream. authenticateStream also accepts ?token= for EventSource. */
router.get('/stream', authenticateStream, notificationController.stream);

router.get('/', authenticate, notificationController.list);
router.get('/unread-count', authenticate, notificationController.unreadCount);
router.post('/read-all', authenticate, notificationController.markAllRead);
router.patch('/:id/read', authenticate, notificationController.markRead);

export default router;
