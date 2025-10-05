import { clerkMiddleware, getAuth, clerkClient } from "@clerk/express";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Verify Clerk secret key is set
if (!process.env.CLERK_SECRET_KEY) {
  throw new Error("Missing CLERK_SECRET_KEY environment variable");
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  
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
  const auth = getAuth(req);
  
  console.log('🔐 Authentication check:', {
    hasAuth: !!auth,
    userId: auth?.userId || 'none',
    path: req.path,
    method: req.method,
  });
  
  if (!auth?.userId) {
    console.error('❌ Authentication failed - no userId found');
    return res.status(401).json({ message: "Unauthorized" });
  }

  console.log('✅ Authentication successful for user:', auth.userId);
  req.auth = auth;
  await syncUserFromClerk(auth.userId);
  next();
};
