import { Router } from "express";
import { db } from "../db";
import { savedSearches, searchAlertNotifications } from "@shared/schema/saved_searches";
import { eq, and, desc } from "drizzle-orm";
import { isAuthenticated } from "../supabaseAuth";

const router = Router();

// Get all saved searches for the current user
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const userSearches = await db
      .select()
      .from(savedSearches)
      .where(eq(savedSearches.userId, userId))
      .orderBy(desc(savedSearches.createdAt));
    
    res.json(userSearches);
  } catch (error) {
    console.error("Error fetching saved searches:", error);
    res.status(500).json({ message: "Failed to fetch saved searches" });
  }
});

// Get a specific saved search
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const searchId = parseInt(req.params.id);
    
    const [search] = await db
      .select()
      .from(savedSearches)
      .where(and(
        eq(savedSearches.id, searchId),
        eq(savedSearches.userId, userId)
      ));
    
    if (!search) {
      return res.status(404).json({ message: "Saved search not found" });
    }
    
    res.json(search);
  } catch (error) {
    console.error("Error fetching saved search:", error);
    res.status(500).json({ message: "Failed to fetch saved search" });
  }
});

// Create a new saved search
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const {
      name,
      searchQuery,
      category,
      condition,
      priceMin,
      priceMax,
      location,
      distance,
      emailNotifications = true,
      smsNotifications = false,
      notificationFrequency = "instant",
    } = req.body;
    
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Search name is required" });
    }
    
    const [newSearch] = await db
      .insert(savedSearches)
      .values({
        userId,
        name: name.trim(),
        searchQuery,
        category,
        condition,
        priceMin,
        priceMax,
        location,
        distance,
        emailNotifications,
        smsNotifications,
        notificationFrequency,
        isActive: true,
      })
      .returning();
    
    res.status(201).json(newSearch);
  } catch (error) {
    console.error("Error creating saved search:", error);
    res.status(500).json({ message: "Failed to create saved search" });
  }
});

// Update a saved search
router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const searchId = parseInt(req.params.id);
    
    // Verify ownership
    const [existing] = await db
      .select()
      .from(savedSearches)
      .where(and(
        eq(savedSearches.id, searchId),
        eq(savedSearches.userId, userId)
      ));
    
    if (!existing) {
      return res.status(404).json({ message: "Saved search not found" });
    }
    
    const {
      name,
      searchQuery,
      category,
      condition,
      priceMin,
      priceMax,
      location,
      distance,
      emailNotifications,
      smsNotifications,
      notificationFrequency,
      isActive,
    } = req.body;
    
    const [updated] = await db
      .update(savedSearches)
      .set({
        ...(name !== undefined && { name: name.trim() }),
        ...(searchQuery !== undefined && { searchQuery }),
        ...(category !== undefined && { category }),
        ...(condition !== undefined && { condition }),
        ...(priceMin !== undefined && { priceMin }),
        ...(priceMax !== undefined && { priceMax }),
        ...(location !== undefined && { location }),
        ...(distance !== undefined && { distance }),
        ...(emailNotifications !== undefined && { emailNotifications }),
        ...(smsNotifications !== undefined && { smsNotifications }),
        ...(notificationFrequency !== undefined && { notificationFrequency }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(eq(savedSearches.id, searchId))
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error("Error updating saved search:", error);
    res.status(500).json({ message: "Failed to update saved search" });
  }
});

// Delete a saved search
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const searchId = parseInt(req.params.id);
    
    // Verify ownership
    const [existing] = await db
      .select()
      .from(savedSearches)
      .where(and(
        eq(savedSearches.id, searchId),
        eq(savedSearches.userId, userId)
      ));
    
    if (!existing) {
      return res.status(404).json({ message: "Saved search not found" });
    }
    
    await db
      .delete(savedSearches)
      .where(eq(savedSearches.id, searchId));
    
    res.json({ message: "Saved search deleted successfully" });
  } catch (error) {
    console.error("Error deleting saved search:", error);
    res.status(500).json({ message: "Failed to delete saved search" });
  }
});

// Partial update (PATCH)
router.patch("/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const searchId = parseInt(req.params.id);
    
    // Verify ownership
    const [existing] = await db
      .select()
      .from(savedSearches)
      .where(and(
        eq(savedSearches.id, searchId),
        eq(savedSearches.userId, userId)
      ));
    
    if (!existing) {
      return res.status(404).json({ message: "Saved search not found" });
    }
    
    const updates = req.body;
    
    const [updated] = await db
      .update(savedSearches)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(savedSearches.id, searchId))
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error("Error updating saved search:", error);
    res.status(500).json({ message: "Failed to update saved search" });
  }
});

// Toggle active status
router.patch("/:id/toggle", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const searchId = parseInt(req.params.id);
    
    // Verify ownership
    const [existing] = await db
      .select()
      .from(savedSearches)
      .where(and(
        eq(savedSearches.id, searchId),
        eq(savedSearches.userId, userId)
      ));
    
    if (!existing) {
      return res.status(404).json({ message: "Saved search not found" });
    }
    
    const [updated] = await db
      .update(savedSearches)
      .set({
        isActive: !existing.isActive,
        updatedAt: new Date(),
      })
      .where(eq(savedSearches.id, searchId))
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error("Error toggling saved search:", error);
    res.status(500).json({ message: "Failed to toggle saved search" });
  }
});

export default router;

