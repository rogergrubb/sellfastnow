import { Router } from "express";
import { db } from "../storage";
import { draftFolders, listings } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { isAuthenticated } from "../supabaseAuth";

const router = Router();

// Get all draft folders for the current user
router.get("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;

    // Get folders with listing counts
    const foldersWithCounts = await db
      .select({
        id: draftFolders.id,
        name: draftFolders.name,
        createdAt: draftFolders.createdAt,
        updatedAt: draftFolders.updatedAt,
        listingsCount: sql<number>`CAST(COUNT(${listings.id}) AS INTEGER)`,
      })
      .from(draftFolders)
      .leftJoin(
        listings,
        and(
          eq(listings.folderId, draftFolders.id),
          eq(listings.status, "draft")
        )
      )
      .where(eq(draftFolders.userId, userId))
      .groupBy(draftFolders.id, draftFolders.name, draftFolders.createdAt, draftFolders.updatedAt)
      .orderBy(draftFolders.createdAt);

    res.json({ folders: foldersWithCounts });
  } catch (error) {
    console.error("Error fetching draft folders:", error);
    res.status(500).json({ error: "Failed to fetch draft folders" });
  }
});

// Create a new draft folder
router.post("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Folder name is required" });
    }

    if (name.length > 200) {
      return res.status(400).json({ error: "Folder name is too long (max 200 characters)" });
    }

    // Create the folder
    const [newFolder] = await db
      .insert(draftFolders)
      .values({
        userId,
        name: name.trim(),
      })
      .returning();

    res.status(201).json({ folder: newFolder });
  } catch (error) {
    console.error("Error creating draft folder:", error);
    res.status(500).json({ error: "Failed to create draft folder" });
  }
});

// Update a draft folder
router.patch("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const folderId = req.params.id;
    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Folder name is required" });
    }

    if (name.length > 200) {
      return res.status(400).json({ error: "Folder name is too long (max 200 characters)" });
    }

    // Check if folder exists and belongs to user
    const [existingFolder] = await db
      .select()
      .from(draftFolders)
      .where(and(eq(draftFolders.id, folderId), eq(draftFolders.userId, userId)))
      .limit(1);

    if (!existingFolder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    // Update the folder
    const [updatedFolder] = await db
      .update(draftFolders)
      .set({
        name: name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(draftFolders.id, folderId))
      .returning();

    res.json({ folder: updatedFolder });
  } catch (error) {
    console.error("Error updating draft folder:", error);
    res.status(500).json({ error: "Failed to update draft folder" });
  }
});

// Delete a draft folder
router.delete("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const folderId = req.params.id;

    // Check if folder exists and belongs to user
    const [existingFolder] = await db
      .select()
      .from(draftFolders)
      .where(and(eq(draftFolders.id, folderId), eq(draftFolders.userId, userId)))
      .limit(1);

    if (!existingFolder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    // Delete the folder (listings will have their folder_id set to null due to ON DELETE SET NULL)
    await db.delete(draftFolders).where(eq(draftFolders.id, folderId));

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting draft folder:", error);
    res.status(500).json({ error: "Failed to delete draft folder" });
  }
});

export default router;

