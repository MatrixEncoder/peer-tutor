const express = require("express");
const { getDb, dbGet, dbRun, dbExec } = require("../database");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

// POST /api/reviews
router.post("/reviews", requireAuth, async (req, res) => {
  try {
    await getDb();
    const userId = req.session.userId;
    const { sessionId, rating, comment } = req.body;

    if (!sessionId) return res.status(400).json({ error: "Session ID is required" });
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Rating must be between 1 and 5" });

    const session = dbGet("SELECT * FROM sessions WHERE id = ?", [sessionId]);
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.status !== "COMPLETED") return res.status(400).json({ error: "You can only review completed sessions" });
    if (session.student_id !== userId) return res.status(403).json({ error: "Only the student can review" });

    const existing = dbGet("SELECT id FROM reviews WHERE session_id = ?", [sessionId]);
    if (existing) return res.status(400).json({ error: "You have already reviewed this session" });

    dbRun(
      "INSERT INTO reviews (session_id, reviewer_id, tutor_profile_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
      [sessionId, userId, session.tutor_profile_id, rating, comment || null]
    );

    // Recalculate average
    const { dbAll } = require("../database");
    const allReviews = dbAll("SELECT rating FROM reviews WHERE tutor_profile_id = ?", [session.tutor_profile_id]);
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    dbExec("UPDATE tutor_profiles SET avg_rating = ?, total_reviews = ? WHERE id = ?", [Math.round(avg * 10) / 10, allReviews.length, session.tutor_profile_id]);

    return res.status(201).json({ message: "Review submitted" });
  } catch (error) {
    console.error("Review error:", error);
    return res.status(500).json({ error: "Could not submit review" });
  }
});

module.exports = router;
