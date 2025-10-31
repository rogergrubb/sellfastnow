import { createClient } from "@supabase/supabase-js";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

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
      
      // First, check if there's an existing user with this email (from old Clerk auth)
      try {
        const [existingUser] = await db.select().from(users).where(eq(users.email, email));
        
        if (existingUser && existingUser.id !== userId) {
          console.log(`🔄 Found old user record with email ${email}, updating to new Supabase ID`);
          // Delete the old user record
          await db.delete(users).where(eq(users.id, existingUser.id));
        }
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
      
      // Check for pending referrals and award credits
      try {
        const referralEmail = email || supabaseUser.user?.email;
        if (referralEmail) {
          const [referral] = await db.execute(sql`
            SELECT id, referrer_id 
            FROM referrals 
            WHERE LOWER(referred_email) = ${referralEmail.toLowerCase()}
            AND status = 'pending'
            LIMIT 1
          `);
          
          if (referral) {
            // Update referral status
            await db.execute(sql`
              UPDATE referrals
              SET 
                referred_user_id = ${userId},
                status = 'completed',
                completed_at = NOW()
              WHERE id = ${referral.id}
            `);
            
            // Award 50 credits to BOTH referrer and referee
            await db.execute(sql`
              UPDATE users
              SET ai_credits_purchased = ai_credits_purchased + 50
              WHERE id = ${referral.referrer_id}
            `);
            
            await db.execute(sql`
              UPDATE users
              SET ai_credits_purchased = ai_credits_purchased + 50
              WHERE id = ${userId}
            `);
            
            // Mark credits as awarded
            await db.execute(sql`
              UPDATE referrals
              SET 
                credits_awarded = true,
                awarded_at = NOW()
              WHERE id = ${referral.id}
            `);
            
            console.log(`🎉 Awarded 50 credits to BOTH referrer ${referral.referrer_id} and referee ${userId}`);
          }
        }
      } catch (referralError) {
        console.error('Error processing referral:', referralError);
        // Don\'t fail user creation if referral fails
      }
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

