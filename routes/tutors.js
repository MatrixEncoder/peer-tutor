const express = require("express");
const { getDb, dbAll, dbGet } = require("../database");
const router = express.Router();

// GET /api/tutors
router.get("/tutors", async (req, res) => {
  try {
    await getDb();
    const { subject, department, minRating } = req.query;

    let query = `
      SELECT tp.id, tp.hourly_rate AS hourlyRate, tp.avg_rating AS avgRating,
             tp.total_reviews AS totalReviews, tp.is_verified AS isVerified,
             tp.subjects, tp.bio AS profileBio,
             u.id AS userId, u.name, u.email, u.university, u.department, u.year_of_study, u.bio
      FROM tutor_profiles tp
      JOIN users u ON tp.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (department && department !== "All") {
      query += " AND u.department LIKE ?";
      params.push(`%${department}%`);
    }
    if (minRating && parseFloat(minRating) > 0) {
      query += " AND tp.avg_rating >= ?";
      params.push(parseFloat(minRating));
    }
    query += " ORDER BY tp.avg_rating DESC";

    let tutors = dbAll(query, params);

    if (subject) {
      tutors = tutors.filter((t) =>
        t.subjects.toLowerCase().split(",").some((s) => s.trim().includes(subject.toLowerCase()))
      );
    }

    const result = tutors.map((t) => ({
      id: t.id,
      hourlyRate: t.hourlyRate,
      avgRating: t.avgRating,
      totalReviews: t.totalReviews,
      isVerified: !!t.isVerified,
      subjects: t.subjects,
      user: { id: t.userId, name: t.name, email: t.email, university: t.university, department: t.department, yearOfStudy: t.year_of_study, bio: t.profileBio || t.bio },
      availability: dbAll("SELECT day_of_week AS dayOfWeek, start_time AS startTime, end_time AS endTime FROM availability WHERE tutor_profile_id = ?", [t.id]),
    }));

    return res.json(result);
  } catch (error) {
    console.error("Error fetching tutors:", error);
    return res.status(500).json({ error: "Could not load tutors" });
  }
});

// GET /api/tutors/:id
router.get("/tutors/:id", async (req, res) => {
  try {
    await getDb();
    const tutor = dbGet(`
      SELECT tp.id, tp.hourly_rate AS hourlyRate, tp.avg_rating AS avgRating,
             tp.total_reviews AS totalReviews, tp.is_verified AS isVerified,
             tp.subjects, tp.bio AS profileBio,
             u.id AS userId, u.name, u.email, u.university, u.department, u.year_of_study, u.bio
      FROM tutor_profiles tp
      JOIN users u ON tp.user_id = u.id
      WHERE tp.id = ?
    `, [req.params.id]);

    if (!tutor) return res.status(404).json({ error: "Tutor not found" });

    const availability = dbAll("SELECT day_of_week AS dayOfWeek, start_time AS startTime, end_time AS endTime FROM availability WHERE tutor_profile_id = ?", [tutor.id]);
    const reviews = dbAll(`
      SELECT r.id, r.rating, r.comment, r.created_at AS createdAt, u.name AS reviewerName
      FROM reviews r JOIN users u ON r.reviewer_id = u.id
      WHERE r.tutor_profile_id = ? ORDER BY r.created_at DESC
    `, [tutor.id]);

    return res.json({
      id: tutor.id,
      hourlyRate: tutor.hourlyRate,
      avgRating: tutor.avgRating,
      totalReviews: tutor.totalReviews,
      isVerified: !!tutor.isVerified,
      subjects: tutor.subjects,
      user: { id: tutor.userId, name: tutor.name, email: tutor.email, university: tutor.university, department: tutor.department, yearOfStudy: tutor.year_of_study, bio: tutor.profileBio || tutor.bio },
      availability,
      reviews: reviews.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, createdAt: r.createdAt, reviewer: { name: r.reviewerName } })),
    });
  } catch (error) {
    console.error("Error fetching tutor:", error);
    return res.status(500).json({ error: "Could not load tutor profile" });
  }
});

module.exports = router;
