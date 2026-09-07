/**
 * Express application setup for LeafScan AI.
 *
 * This file BUILDS the application: middleware, routes, error
 * handling. It does not start listening for requests - that is
 * server.ts. Keeping them apart makes the app testable and makes
 * the startup sequence easy to read.
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';

import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import uploadRoutes from './routes/upload.routes';
import dashboardRoutes from './routes/dashboard.routes';
import diseaseRoutes from './routes/disease.routes';
import reportRoutes from './routes/report.routes';
import farmerRoutes from './routes/farmer.routes';
import notificationRoutes from './routes/notification.routes';
import healthRoutes from './routes/health.routes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { authenticateAsset } from './middleware/auth.middleware';
import { isAllowedOrigin } from './utils/corsOrigin';
import { ApiError } from './utils/ApiError';

const app: Application = express();

// ============================================================
// MIDDLEWARE - order matters, these run top to bottom
// ============================================================

app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header means the caller is not a browser enforcing
      // CORS - the native mobile app, a server, curl, Postman - so
      // there is nothing here for CORS to restrict.
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      // A real rejection, not a server fault - 403, not the
      // generic 500 a plain Error would fall through to.
      callback(ApiError.forbidden('Not allowed by CORS', 'CORS_NOT_ALLOWED'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Print one line per request, so you can SEE traffic arriving.
app.use(morgan('dev'));

// Parse incoming JSON bodies into req.body.
// The 1mb limit protects against oversized payloads. Images do
// NOT come through here - they use multipart, added in Phase 8.
app.use(express.json({ limit: '1mb' }));

// Parse HTML form-style bodies.
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve uploaded leaf images as static files, so the mobile app
// and admin site can display them via a normal image URL. Gated
// behind authenticateAsset so a photo - including a farmer's own
// face - is not world-readable to anyone who obtains the URL.
app.use(
  '/uploads',
  authenticateAsset,
  express.static(path.resolve(__dirname, '../', env.upload.dir))
);

// ============================================================
// ROUTES
// ============================================================

// A friendly response at the root, so visiting the bare address
// shows something useful instead of an error.
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'LeafScan AI API',
    documentation: '/api/health',
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/diseases', diseaseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/notifications', notificationRoutes);

// Future routers are added here in later phases:
// app.use('/api/detections', detectionRoutes);      <- Phase 13
// app.use('/api/recommendations', recommendationRoutes); <- Phase 22

// ============================================================
// ERROR HANDLING - must be registered LAST
// ============================================================

// Any request that reached this point matched no route.
app.use(notFoundHandler);

// The final safety net.
app.use(errorHandler);

export default app;