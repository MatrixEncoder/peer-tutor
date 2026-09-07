const express = require("express");
const { getDb, dbAll, dbGet, dbRun, dbExec } = require("../database");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

// POST /api/sessions
router.post("/sessions", requireAuth, async (req, res) => {
  try {
    await getDb();
    const userId = req.session.userId;
    const { tutorProfileId, subject, scheduledDate, scheduledTime, durationMinutes, notes } = req.body;

    if (!tutorProfileId) return res.status(400).json({ error: "Tutor is required" });
    if (!subject) return res.status(400).json({ error: "Subject is required" });
    if (!scheduledDate) return res.status(400).json({ error: "Date is required" });
    if (!scheduledTime) return res.status(400).json({ error: "Time is required" });
    const duration = parseInt(durationMinutes) || 60;

    const tutorProfile = dbGet("SELECT * FROM tutor_profiles WHERE id = ?", [tutorProfileId]);
    if (!tutorProfile) return res.status(404).json({ error: "Tutor not found" });
    if (tutorProfile.user_id === userId) return res.status(400).json({ error: "You cannot book yourself" });

    const conflict = dbGet(
      "SELECT id FROM sessions WHERE tutor_profile_id = ? AND scheduled_date = ? AND scheduled_time = ? AND status IN ('PENDING', 'ACCEPTED')",
      [tutorProfileId, scheduledDate, scheduledTime]
    );
    if (conflict) return res.status(409).json({ error: "That time slot is already booked." });

    const totalCost = tutorProfile.hourly_rate * (duration / 60);
    const result = dbRun(
      "INSERT INTO sessions (student_id, tutor_id, tutor_profile_id, subject, scheduled_date, scheduled_time, duration_minutes, status, total_cost, notes) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)",
      [userId, tutorProfile.user_id, tutorProfileId, subject, scheduledDate, scheduledTime, duration, totalCost, notes || null]
    );

    return res.status(201).json({ id: result.lastInsertRowid, message: "Session booked" });
  } catch (error) {
    console.error("Booking error:", error);
    return res.status(500).json({ error: "Could not create booking" });
  }
});

// GET /api/sessions
router.get("/sessions", requireAuth, async (req, res) => {
  try {
    await getDb();
    const userId = req.session.userId;
    const role = req.query.role || "student";

    let sessions;
    if (role === "tutor") {
      sessions = dbAll(`
        SELECT s.*, u.name AS studentName, u.email AS studentEmail, u.university AS studentUniversity
        FROM sessions s JOIN users u ON s.student_id = u.id
        WHERE s.tutor_id = ? ORDER BY s.scheduled_date DESC
      `, [userId]);
      sessions = sessions.map((s) => ({ ...s, student: { name: s.studentName, email: s.studentEmail, university: s.studentUniversity } }));
    } else {
      sessions = dbAll(`
        SELECT s.*, u.name AS tutorName, u.university AS tutorUniversity
        FROM sessions s JOIN users u ON s.tutor_id = u.id
        WHERE s.student_id = ? ORDER BY s.scheduled_date DESC
      `, [userId]);
      sessions = sessions.map((s) => ({ ...s, tutorProfile: { user: { name: s.tutorName, university: s.tutorUniversity } } }));
    }

    sessions = sessions.map((s) => {
      const review = dbGet("SELECT rating, comment FROM reviews WHERE session_id = ?", [s.id]);
      return { ...s, review: review || null };
    });

    return res.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return res.status(500).json({ error: "Could not load sessions" });
  }
});

// PATCH /api/sessions/:id
router.patch("/sessions/:id", requireAuth, async (req, res) => {
  try {
    await getDb();
    const userId = req.session.userId;
    const { status, cancelReason } = req.body;

    const validStatuses = ["PENDING", "ACCEPTED", "DECLINED", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status" });

    const session = dbGet("SELECT * FROM sessions WHERE id = ?", [req.params.id]);
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (status === "ACCEPTED" && session.tutor_id !== userId) return res.status(403).json({ error: "Only the tutor can accept sessions" });
    if (status === "DECLINED" && session.tutor_id !== userId) return res.status(403).json({ error: "Only the tutor can decline sessions" });
    if (status === "COMPLETED" && session.tutor_id !== userId) return res.status(403).json({ error: "Only the tutor can mark sessions complete" });
    if (status === "CANCELLED" && session.student_id !== userId && session.tutor_id !== userId) return res.status(403).json({ error: "You are not part of this session" });

    if (cancelReason) {
      dbExec("UPDATE sessions SET status = ?, cancel_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [status, cancelReason, req.params.id]);
    } else {
      dbExec("UPDATE sessions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [status, req.params.id]);
    }

    return res.json({ message: `Session ${status.toLowerCase()}` });
  } catch (error) {
    console.error("Error updating session:", error);
    return res.status(500).json({ error: "Could not update session" });
  }
});

module.exports = router;
