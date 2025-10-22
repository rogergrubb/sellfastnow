import { clerkMiddleware, getAuth, clerkClient } from "@clerk/express";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

// Verify Clerk secret key is set
if (!process.env.CLERK_SECRET_KEY) {
  throw new Error("Missing CLERK_SECRET_KEY environment variable");
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  
  // Security headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled for Vite dev server compatibility
    crossOriginEmbedderPolicy: false,
  }));
  
  // Rate limiting for authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  // Stricter rate limiting for login attempts
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: 'Too many login attempts, please try again after 15 minutes.',
    skipSuccessfulRequests: true, // Don't count successful logins
  });
  
  // Apply rate limiters
  app.use('/api/auth', authLimiter);
  app.use('/api/sign-in', loginLimiter);
  app.use('/api/sign-up', loginLimiter);
  
  // Apply Clerk middleware globally (lax mode - doesn't enforce auth)
  app.use(clerkMiddleware({
    debug: process.env.NODE_ENV === 'development',
  }));
}

async function syncUserFromClerk(userId: string) {
  try {
    let user = await storage.getUser(userId);
    
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);
      
      await storage.upsertUser({
        id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        profileImageUrl: clerkUser.imageUrl || "",
      });
      
      user = await storage.getUser(userId);
    }
    
    return user;
  } catch (error) {
    console.error("Error syncing user from Clerk:", error);
    return null;
  }
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  let auth = getAuth(req);
  let authMethod = 'session';
  
  // If session auth fails, try Bearer token
  if (!auth?.userId && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      authMethod = 'bearer';
      
      try {
        // Verify token with Clerk
        const response = await fetch('https://api.clerk.com/v1/tokens/verify', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
        
        if (response.ok) {
          const data = await response.json();
          auth = { userId: data.sub } as any;
          console.log('🔑 Bearer token verification successful');
        } else {
          console.error('❌ Bearer token verification failed:', response.status);
        }
      } catch (error) {
        console.error('❌ Error verifying Bearer token:', error);
      }
    }
  }
  
  console.log('🔐 Authentication check:', {
    hasAuth: !!auth,
    userId: auth?.userId || 'none',
    path: req.path,
    method: req.method,
    authMethod: auth?.userId ? authMethod : 'none',
  });
  
  if (!auth?.userId) {
    console.error('❌ Authentication failed - no userId found');
    console.error('❌ Request headers:', {
      authorization: req.headers.authorization ? 'present' : 'missing',
      cookie: req.headers.cookie ? 'present' : 'missing',
    });
    return res.status(401).json({ message: "Unauthorized" });
  }

  console.log('✅ Authentication successful for user:', auth.userId);
  req.auth = auth;
  await syncUserFromClerk(auth.userId);
  next();
};
