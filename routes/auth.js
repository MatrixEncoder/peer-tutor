const express = require("express");
const bcrypt = require("bcryptjs");
const { getDb, dbAll, dbGet, dbRun, dbExec, saveDb } = require("../database");
const router = express.Router();

// POST /api/register
router.post("/register", async (req, res) => {
  try {
    await getDb();
    const { name, email, password, university, department, yearOfStudy, role } = req.body;

    if (!name || name.length < 2) return res.status(400).json({ error: "Name must be at least 2 characters" });
    if (!email || !email.includes("@")) return res.status(400).json({ error: "Valid email is required" });
    if (!password || password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    if (!university) return res.status(400).json({ error: "University name is required" });
    if (!department) return res.status(400).json({ error: "Department is required" });
    if (!["STUDENT", "TUTOR", "BOTH"].includes(role)) return res.status(400).json({ error: "Invalid role" });

    const existing = dbGet("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) return res.status(400).json({ error: "An account with that email already exists" });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = dbRun(
      "INSERT INTO users (name, email, password, university, department, year_of_study, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, email, hashedPassword, university, department, yearOfStudy || 1, role]
    );

    if (role === "TUTOR" || role === "BOTH") {
      dbRun("INSERT INTO tutor_profiles (user_id, subjects, hourly_rate) VALUES (?, '', 0)", [result.lastInsertRowid]);
    }

    return res.status(201).json({ message: "Account created successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// POST /api/login
router.post("/login", async (req, res) => {
  try {
    await getDb();
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const user = dbGet("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    req.session.userId = user.id;
    req.session.userRole = user.role;

    return res.json({
      message: "Logged in successfully",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Could not log out" });
    res.clearCookie("connect.sid");
    return res.json({ message: "Logged out" });
  });
});

// GET /api/me
router.get("/me", async (req, res) => {
  if (!req.session || !req.session.userId) return res.json({ user: null });
  await getDb();
  const user = dbGet("SELECT id, name, email, university, department, year_of_study, bio, role FROM users WHERE id = ?", [req.session.userId]);
  if (!user) return res.json({ user: null });
  return res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, university: user.university, department: user.department, yearOfStudy: user.year_of_study, bio: user.bio },
  });
});

// GET /api/profile
router.get("/profile", async (req, res) => {
  if (!req.session || !req.session.userId) return res.status(401).json({ error: "Not logged in" });
  await getDb();

  const user = dbGet("SELECT id, name, email, university, department, year_of_study, bio, role FROM users WHERE id = ?", [req.session.userId]);
  if (!user) return res.status(404).json({ error: "User not found" });

  const tutorProfile = dbGet("SELECT * FROM tutor_profiles WHERE user_id = ?", [req.session.userId]);
  let availability = [];
  if (tutorProfile) {
    availability = dbAll("SELECT day_of_week AS dayOfWeek, start_time AS startTime, end_time AS endTime FROM availability WHERE tutor_profile_id = ?", [tutorProfile.id]);
  }

  return res.json({
    ...user,
    yearOfStudy: user.year_of_study,
    tutorProfile: tutorProfile
      ? { ...tutorProfile, hourlyRate: tutorProfile.hourly_rate, avgRating: tutorProfile.avg_rating, totalReviews: tutorProfile.total_reviews, isVerified: !!tutorProfile.is_verified, availability }
      : null,
  });
});

// PUT /api/profile
router.put("/profile", async (req, res) => {
  if (!req.session || !req.session.userId) return res.status(401).json({ error: "Not logged in" });
  await getDb();

  const { name, bio, university, department, yearOfStudy, hourlyRate, subjects } = req.body;

  try {
    const fields = [];
    const params = [];
    if (name) { fields.push("name = ?"); params.push(name); }
    if (bio !== undefined) { fields.push("bio = ?"); params.push(bio); }
    if (university) { fields.push("university = ?"); params.push(university); }
    if (department) { fields.push("department = ?"); params.push(department); }
    if (yearOfStudy) { fields.push("year_of_study = ?"); params.push(yearOfStudy); }
    fields.push("updated_at = CURRENT_TIMESTAMP");
    params.push(req.session.userId);

    if (fields.length > 1) {
      dbExec(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, params);
    }

    // Tutor fields
    const user = dbGet("SELECT role FROM users WHERE id = ?", [req.session.userId]);
    if (user.role === "TUTOR" || user.role === "BOTH") {
      const existing = dbGet("SELECT id FROM tutor_profiles WHERE user_id = ?", [req.session.userId]);
      if (existing) {
        const tpFields = [];
        const tpParams = [];
        if (hourlyRate !== undefined) { tpFields.push("hourly_rate = ?"); tpParams.push(hourlyRate); }
        if (subjects !== undefined) { tpFields.push("subjects = ?"); tpParams.push(subjects); }
        if (tpFields.length > 0) {
          tpParams.push(req.session.userId);
          dbExec(`UPDATE tutor_profiles SET ${tpFields.join(", ")} WHERE user_id = ?`, tpParams);
        }
      } else {
        dbRun("INSERT INTO tutor_profiles (user_id, subjects, hourly_rate) VALUES (?, ?, ?)", [req.session.userId, subjects || "", hourlyRate || 0]);
      }
    }

    return res.json({ message: "Profile updated" });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ error: "Could not update profile" });
  }
});

module.exports = router;
