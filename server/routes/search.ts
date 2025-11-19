import { db } from "../storage";
import { listings, users, userStatistics } from "@shared/schema";
import { sql, and, or, asc, desc, gte, lte, ilike, inArray, eq } from "drizzle-orm";
import type { Express } from "express";

export default function searchRoutes(app: Express) {
  app.get("/api/listings/search", async (req, res) => {
    try {
      const { lat, lng, radius, query, category, minPrice, maxPrice, sortBy, order } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and longitude are required." });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const searchRadius = radius ? parseInt(radius as string, 10) : 50; // Default to 50km

      // Haversine formula for distance calculation in kilometers
      const distanceFormula = sql`(
        6371 * acos(
          cos(radians(${latitude})) * cos(radians(location_latitude)) * cos(radians(location_longitude) - radians(${longitude})) + 
          sin(radians(${latitude})) * sin(radians(location_latitude))
        )
      )`;

      let whereClauses = [sql`${distanceFormula} <= ${searchRadius}`];

      if (query) {
        whereClauses.push(or(
          ilike(listings.title, `%${query}%`),
          ilike(listings.description, `%${query}%`)
        ));
      }

      if (category) {
        whereClauses.push(sql`${listings.category} = ${category}`);
      }

      if (minPrice) {
        whereClauses.push(gte(listings.price, parseInt(minPrice as string, 10)));
      }

      if (maxPrice) {
        whereClauses.push(lte(listings.price, parseInt(maxPrice as string, 10)));
      }

      let orderByClause;
      const sortOrder = order === 'desc' ? desc : asc;

      switch (sortBy) {
        case 'price':
          orderByClause = sortOrder(listings.price);
          break;
        case 'date':
          orderByClause = sortOrder(listings.createdAt);
          break;
        case 'distance':
        default:
          orderByClause = asc(distanceFormula);
          break;
      }

      // Get listings with distance
      const searchResults = await db
        .select({
          id: listings.id,
          userId: listings.userId,
          title: listings.title,
          price: listings.price,
          description: listings.description,
          category: listings.category,
          condition: listings.condition,
          location: listings.location,
          images: listings.images,
          createdAt: listings.createdAt,
          distance: distanceFormula,
        })
        .from(listings)
        .where(and(...whereClauses))
        .orderBy(orderByClause);

      // Get unique user IDs
      const userIds = [...new Set(searchResults.map(l => l.userId))];

      if (userIds.length === 0) {
        return res.json([]);
      }

      // Fetch seller information for all unique users
      const sellersData = await db
        .select({
          userId: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          emailVerified: users.emailVerified,
          phoneVerified: users.phoneVerified,
          idVerified: users.idVerified,
          addressVerified: users.addressVerified,
          averageRating: userStatistics.averageRating,
          totalReviews: userStatistics.totalReviewsReceived,
          successRate: userStatistics.sellerSuccessRate,
        })
        .from(users)
        .leftJoin(userStatistics, eq(users.id, userStatistics.userId))
        .where(inArray(users.id, userIds));

      // Create a map for quick lookup
      const sellersMap = new Map(
        sellersData.map(seller => [
          seller.userId,
          {
            seller: {
              id: seller.userId,
              firstName: seller.firstName,
              lastName: seller.lastName,
              profileImageUrl: seller.profileImageUrl,
              emailVerified: seller.emailVerified,
              phoneVerified: seller.phoneVerified,
              idVerified: seller.idVerified,
              addressVerified: seller.addressVerified,
            },
            sellerStats: {
              averageRating: seller.averageRating,
              totalReviews: seller.totalReviews || 0,
              successRate: seller.successRate,
            },
          },
        ])
      );

      // Combine listings with seller data
      const resultsWithSellers = searchResults.map(listing => ({
        ...listing,
        ...(sellersMap.get(listing.userId) || {}),
      }));

      res.json(resultsWithSellers);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "An error occurred during the search." });
    }
  });
}
