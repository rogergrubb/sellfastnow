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
    const baseUrl = process.env.BASE_URL || "https://sellfastnow-production.up.railway.app";
    
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
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    staticPages.forEach(page => {
      xml += "  <url>\n";
      xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += "  </url>\n";
    });

    // Add category pages
    categoryPages.forEach(page => {
      xml += "  <url>\n";
      xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += "  </url>\n";
    });

    // Add listing pages
    activeListings.forEach(listing => {
      const lastmod = listing.updatedAt 
        ? new Date(listing.updatedAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      
      xml += "  <url>\n";
      xml += `    <loc>${baseUrl}/listings/${listing.id}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += "  </url>\n";
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

