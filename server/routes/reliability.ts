import { Router, Request, Response } from "express";
import { db } from "../db";
import { reliabilityScores } from "../../shared/meetup-schema";
import { eq } from "drizzle-orm";

const router = Router();

// GET /api/reliability/:userId - Get reliability score for a user
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const [score] = await db
      .select()
      .from(reliabilityScores)
      .where(eq(reliabilityScores.userId, userId));

    if (!score) {
      // Return default score if user has no meetup history
      return res.json({
        userId,
        totalMeetups: 0,
        completedMeetups: 0,
        cancelledMeetups: 0,
        onTimeCount: 0,
        lateCount: 0,
        noShowCount: 0,
        reliabilityScore: 0,
        averagePunctuality: null,
      });
    }

    res.json(score);
  } catch (error) {
    console.error("Error fetching reliability score:", error);
    res.status(500).json({ error: "Failed to fetch reliability score" });
  }
});

export default router;

