import { Router } from "express";
import { isAuthenticated } from "../supabaseAuth";
import { storage } from "../storage";

const router = Router();

/**
 * GET /api/location/detect
 * Detect user's location from IP address
 */
router.get("/detect", async (req, res) => {
  try {
    const { detectLocationWithFallback, getClientIP } = await import("../geolocation");
    const clientIP = getClientIP(req);
    console.log(`🌍 Location detection requested from IP: ${clientIP}`);
    
    const location = await detectLocationWithFallback(clientIP);
    res.json(location);
  } catch (error) {
    console.error("Error detecting location:", error);
    res.status(500).json({ message: "Failed to detect location" });
  }
});

/**
 * PUT /api/user/location
 * Update user's location
 */
router.put("/user/location", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const { city, region, country, postalCode, latitude, longitude, displayPrecision } = req.body;
    
    if (!city || !country) {
      return res.status(400).json({ message: "City and country are required" });
    }
    
    const updateData: any = {
      locationCity: city,
      locationRegion: region || null,
      locationCountry: country,
      locationPostalCode: postalCode || null,
      locationLatitude: latitude ? latitude.toString() : null,
      locationLongitude: longitude ? longitude.toString() : null,
      locationDisplayPrecision: displayPrecision || 'city',
      // Also update legacy location field for compatibility
      location: `${city}, ${region ? region + ', ' : ''}${country}`,
    };
    
    const updated = await storage.updateUserProfile(userId, updateData);
    console.log(`✅ Location updated for user ${userId}: ${city}, ${country}`);
    res.json(updated);
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ message: "Failed to update location" });
  }
});

export default router;

