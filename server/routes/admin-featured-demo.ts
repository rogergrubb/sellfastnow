import { Router } from "express";
import { db } from "../db";
import { listings } from "@shared/schema";
import { sql } from "drizzle-orm";

const router = Router();

// Admin endpoint to create demo featured listings
router.post("/create-demo-featured", async (req, res) => {
  try {
    // Get first user from database
    const [user] = await db.execute(sql`SELECT id FROM users LIMIT 1`);
    
    if (!user) {
      return res.status(400).json({ error: "No users found in database" });
    }

    const userId = (user as any).id;
    
    // Demo listings data
    const demoListings = [
      {
        id: 'featured-demo-1',
        title: 'Vintage Camera Collection',
        description: 'Beautiful vintage camera collection from the 1960s. Includes 3 classic film cameras in excellent condition.',
        price: '299.99',
        category: 'electronics',
        condition: 'good',
        primaryImage: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400',
        location: 'San Francisco, CA'
      },
      {
        id: 'featured-demo-2',
        title: 'Designer Leather Sofa',
        description: 'Modern Italian leather sofa in pristine condition. Perfect for any living room.',
        price: '1299.00',
        category: 'furniture',
        condition: 'like-new',
        primaryImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
        location: 'Los Angeles, CA'
      },
      {
        id: 'featured-demo-3',
        title: 'Mountain Bike - Trek X-Caliber',
        description: 'High-performance mountain bike, barely used. Great for trails and off-road adventures.',
        price: '850.00',
        category: 'sports',
        condition: 'like-new',
        primaryImage: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=400',
        location: 'Seattle, WA'
      },
      {
        id: 'featured-demo-4',
        title: 'Apple MacBook Pro 16"',
        description: 'Latest MacBook Pro with M3 chip, 32GB RAM, 1TB SSD. Like new condition with original box.',
        price: '2499.00',
        category: 'electronics',
        condition: 'like-new',
        primaryImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
        location: 'New York, NY'
      }
    ];

    const createdListings = [];

    for (const listing of demoListings) {
      await db.execute(sql`
        INSERT INTO listings (
          id, user_id, title, description, price, category, condition, status,
          primary_image, images, location, featured_until, featured_duration,
          featured_created_at, created_at, updated_at
        ) VALUES (
          ${listing.id}, ${userId}, ${listing.title}, ${listing.description},
          ${listing.price}, ${listing.category}, ${listing.condition}, 'active',
          ${listing.primaryImage}, ARRAY[${listing.primaryImage}], ${listing.location},
          NOW() + INTERVAL '7 days', '7d', NOW(), NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          featured_until = NOW() + INTERVAL '7 days',
          featured_duration = '7d',
          featured_created_at = NOW(),
          status = 'active',
          updated_at = NOW()
      `);
      
      createdListings.push(listing.title);
    }

    res.json({
      success: true,
      message: "Demo featured listings created successfully!",
      listings: createdListings,
      count: createdListings.length
    });
  } catch (error: any) {
    console.error("Error creating demo featured listings:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
