import { Router } from "express";
import { db } from "../db";
import { listings } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * Generate XML sitemap for search engines
 * Includes all active listings and static pages
 */
router.get("/sitemap.xml", async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL || "https://sellfast.now";
    
    // Get all active listings
    const activeListings = await db
      .select({
        id: listings.id,
        updatedAt: listings.updatedAt,
      })
      .from(listings)
      .where(eq(listings.status, "active"));

    // Static pages
    const staticPages = [
      { url: "/", priority: "1.0", changefreq: "daily" },
      { url: "/how-it-works", priority: "0.8", changefreq: "monthly" },
      { url: "/sign-in", priority: "0.5", changefreq: "monthly" },
      { url: "/sign-up", priority: "0.5", changefreq: "monthly" },
    ];

    // Categories
    const categories = [
      "Electronics",
      "Furniture",
      "Vehicles",
      "Clothing",
      "Home & Garden",
      "Sports & Outdoors",
      "Toys & Games",
      "Books & Media",
      "Tools & Equipment",
      "Other",
    ];

    const categoryPages = categories.map(cat => ({
      url: `/?category=${encodeURIComponent(cat)}`,
      priority: "0.7",
      changefreq: "daily",
    }));

    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>
';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
';

    // Add static pages
    staticPages.forEach(page => {
      xml += "  <url>
";
      xml += `    <loc>${baseUrl}${page.url}</loc>
`;
      xml += `    <changefreq>${page.changefreq}</changefreq>
`;
      xml += `    <priority>${page.priority}</priority>
`;
      xml += "  </url>
";
    });

    // Add category pages
    categoryPages.forEach(page => {
      xml += "  <url>
";
      xml += `    <loc>${baseUrl}${page.url}</loc>
`;
      xml += `    <changefreq>${page.changefreq}</changefreq>
`;
      xml += `    <priority>${page.priority}</priority>
`;
      xml += "  </url>
";
    });

    // Add listing pages
    activeListings.forEach(listing => {
      const lastmod = listing.updatedAt 
        ? new Date(listing.updatedAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      
      xml += "  <url>
";
      xml += `    <loc>${baseUrl}/listings/${listing.id}</loc>
`;
      xml += `    <lastmod>${lastmod}</lastmod>
`;
      xml += `    <changefreq>weekly</changefreq>
`;
      xml += `    <priority>0.6</priority>
`;
      xml += "  </url>
";
    });

    xml += "</urlset>";

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
});

export default router;

