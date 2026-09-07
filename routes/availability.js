const express = require("express");
const { getDb, dbRun, dbExec } = require("../database");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

// PUT /api/availability
router.put("/availability", requireAuth, async (req, res) => {
  try {
    await getDb();
    const userId = req.session.userId;
    const { slots } = req.body;

    if (!Array.isArray(slots)) return res.status(400).json({ error: "Slots must be an array" });

    const { dbGet } = require("../database");
    const tutorProfile = dbGet("SELECT id FROM tutor_profiles WHERE user_id = ?", [userId]);
    if (!tutorProfile) return res.status(400).json({ error: "You need a tutor profile to set availability" });

    dbExec("DELETE FROM availability WHERE tutor_profile_id = ?", [tutorProfile.id]);

    for (const slot of slots) {
      if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6 || !slot.startTime || !slot.endTime) continue;
      dbRun(
        "INSERT INTO availability (tutor_profile_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)",
        [tutorProfile.id, slot.dayOfWeek, slot.startTime, slot.endTime]
      );
    }

    return res.json({ message: "Availability updated" });
  } catch (error) {
    console.error("Availability error:", error);
    return res.status(500).json({ error: "Could not update availability" });
  }
});

module.exports = router;
