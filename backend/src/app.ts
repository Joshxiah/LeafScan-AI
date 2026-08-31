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
import healthRoutes from './routes/health.routes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

const app: Application = express();

// ============================================================
// MIDDLEWARE - order matters, these run top to bottom
// ============================================================

// Allow the mobile app and admin website to call this API.
// Wide open during development; restricted in Phase 24.
app.use(
  cors({
    origin: '*',
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
// and admin site can display them via a normal image URL.
app.use(
  '/uploads',
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

// Future routers are added here in later phases:
// app.use('/api/auth', authRoutes);                 <- Phase 5
// app.use('/api/farmers', farmerRoutes);            <- Phase 20
// app.use('/api/detections', detectionRoutes);      <- Phase 13
// app.use('/api/diseases', diseaseRoutes);          <- Phase 21
// app.use('/api/recommendations', recommendationRoutes); <- Phase 22
// app.use('/api/dashboard', dashboardRoutes);       <- Phase 19

// ============================================================
// ERROR HANDLING - must be registered LAST
// ============================================================

// Any request that reached this point matched no route.
app.use(notFoundHandler);

// The final safety net.
app.use(errorHandler);

export default app;