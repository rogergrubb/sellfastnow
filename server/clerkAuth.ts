import { clerkMiddleware, requireAuth as clerkRequireAuth } from "@clerk/backend";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

export function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(
    clerkMiddleware({
      secretKey: process.env.CLERK_SECRET_KEY,
    })
  );
}

async function syncUserFromClerk(req: any) {
  const auth = req.auth;
  if (!auth?.userId) {
    return null;
  }

  const clerkUserId = auth.userId;
  
  try {
    let user = await storage.getUser(clerkUserId);
    
    if (!user) {
      const firstName = (req.auth.sessionClaims?.firstName as string) || "";
      const lastName = (req.auth.sessionClaims?.lastName as string) || "";
      const email = (req.auth.sessionClaims?.email as string) || "";
      const profileImageUrl = (req.auth.sessionClaims?.imageUrl as string) || "";

      await storage.upsertUser({
        id: clerkUserId,
        email: email,
        firstName: firstName,
        lastName: lastName,
        profileImageUrl: profileImageUrl,
      });
      
      user = await storage.getUser(clerkUserId);
    }
    
    return user;
  } catch (error) {
    console.error("Error syncing user from Clerk:", error);
    return null;
  }
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  await syncUserFromClerk(req);
  next();
};
