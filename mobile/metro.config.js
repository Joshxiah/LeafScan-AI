const http = require('http');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// ------------------------------------------------------------
// Dev-only API proxy.
//
// A phone on the same Wi-Fi reaches the Metro bundler (this
// process, port 8081) but often CANNOT reach the backend on port
// 4000 - Windows Firewall blocks inbound LAN connections to it.
//
// So instead of the app talking to the PC's IP on :4000 directly,
// it talks to Metro on :8081 and Metro forwards anything under
// /api or /uploads to the backend over loopback (127.0.0.1:4000),
// which the firewall never inspects. No admin, no firewall rule.
//
// src/constants/config.ts points the app at the Metro port in dev
// to make this work.
// ------------------------------------------------------------

const BACKEND_HOST = '127.0.0.1';
const BACKEND_PORT = 4000;

function isProxiedPath(url) {
  return (
    url === '/api' ||
    url.startsWith('/api/') ||
    url === '/uploads' ||
    url.startsWith('/uploads/')
  );
}

function proxyToBackend(req, res) {
  const proxyReq = http.request(
    {
      host: BACKEND_HOST,
      port: BACKEND_PORT,
      method: req.method,
      path: req.url,
      headers: { ...req.headers, host: `${BACKEND_HOST}:${BACKEND_PORT}` },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: false,
        message:
          'Backend not reachable through the Metro proxy. Is the backend running (npm run dev in backend/)? ' +
          err.message,
      })
    );
  });

  // Stream the request body straight through - this is what lets
  // multipart photo uploads work, not just JSON.
  req.pipe(proxyReq);
}

function withApiProxy(config) {
  const baseEnhance = config.server && config.server.enhanceMiddleware;

  config.server = {
    ...config.server,
    enhanceMiddleware: (metroMiddleware, metroServer) => {
      const downstream = baseEnhance
        ? baseEnhance(metroMiddleware, metroServer)
        : metroMiddleware;

      return (req, res, next) => {
        if (req.url && isProxiedPath(req.url)) {
          proxyToBackend(req, res);
          return;
        }
        return downstream(req, res, next);
      };
    },
  };

  return config;
}

const config = withNativeWind(getDefaultConfig(__dirname), { input: './global.css' });

module.exports = withApiProxy(config);
