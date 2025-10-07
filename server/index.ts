import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

console.log('=== CLERK KEYS DEBUG ===');
console.log('CLERK_SECRET_KEY exists:', !!process.env.CLERK_SECRET_KEY);
console.log('CLERK_SECRET_KEY starts with:', process.env.CLERK_SECRET_KEY?.substring(0, 10));
console.log('CLERK_PUBLISHABLE_KEY exists:', !!process.env.CLERK_PUBLISHABLE_KEY);
console.log('CLERK_PUBLISHABLE_KEY starts with:', process.env.CLERK_PUBLISHABLE_KEY?.substring(0, 10));
console.log('VITE_CLERK_PUBLISHABLE_KEY exists:', !!process.env.VITE_CLERK_PUBLISHABLE_KEY);
console.log('VITE_CLERK_PUBLISHABLE_KEY starts with:', process.env.VITE_CLERK_PUBLISHABLE_KEY?.substring(0, 10));
console.log('========================');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Global error handler - must be after all routes
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // Handle Clerk handshake errors gracefully (old session from different Clerk instance)
    if (err.message?.includes('handshake') || err.message?.includes('kid') || err.code === 'invalid_handshake_code') {
      log(`Clerk handshake error (gracefully handled): ${err.message.substring(0, 100)}...`);
      
      // For API requests, send JSON error
      if (req.path.startsWith('/api')) {
        if (!res.headersSent) {
          return res.status(401).json({ 
            error: 'Session verification failed',
            code: 'HANDSHAKE_FAILED'
          });
        }
        return;
      }
      
      // For non-API requests (HTML pages), just continue - let Vite serve the page
      // The Clerk client will handle the invalid session on the frontend
      return next();
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    log(`Error: ${message}`);
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
