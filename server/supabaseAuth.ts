import { createClient } from "@supabase/supabase-js";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variable");
}

// Create Supabase admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  console.log("✅ Supabase authentication initialized");
}

async function syncUserFromSupabase(userId: string, email: string) {
  try {
    let user = await storage.getUser(userId);
    
    if (!user) {
      // Get user metadata from Supabase
      const { data: supabaseUser, error } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (error) {
        console.error("Error fetching user from Supabase:", error);
        return null;
      }
      
      // First, delete any existing user with this email (from old Clerk auth)
      try {
        await db.execute(sql`DELETE FROM users WHERE email = ${email} AND id != ${userId}`);
        console.log(`🔄 Removed old user records with email ${email}`);
      } catch (deleteError) {
        console.log("No old user records to delete");
      }
      
      // Now create/update the user with the new Supabase ID
      await storage.upsertUser({
        id: userId,
        email: email || supabaseUser.user?.email || "",
        firstName: supabaseUser.user?.user_metadata?.firstName || "",
        lastName: supabaseUser.user?.user_metadata?.lastName || "",
        profileImageUrl: supabaseUser.user?.user_metadata?.avatar_url || "",
      });
      
      user = await storage.getUser(userId);
    }
    
    return user;
  } catch (error) {
    console.error("Error syncing user from Supabase:", error);
    return null;
  }
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  try {
    // Get Bearer token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Authentication failed - no Bearer token found');
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const token = authHeader.substring(7);
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      console.error('❌ Token verification failed:', error?.message || 'No user found');
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    console.log('✅ Authentication successful for user:', user.id);
    
    // Attach user info to request
    req.auth = {
      userId: user.id,
      email: user.email,
    };
    
    // Sync user to local database
    await syncUserFromSupabase(user.id, user.email || "");
    
    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

