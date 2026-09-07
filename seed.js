// Seed script - run with: node seed.js
const bcrypt = require("bcryptjs");
const { getDb, initDatabase, dbRun, dbExec, dbGet, dbAll, saveDb } = require("./database");

const MOCK_USERS = [
  { name: "Alex Chen", email: "alex@university.edu", university: "University of Toronto", department: "Computer Science", yearOfStudy: 4, bio: "4th year CS student. Love algorithms and competitive programming.", role: "BOTH", subjects: "CS101 - Intro to Programming,CS201 - Data Structures,CS301 - Algorithms", hourlyRate: 25 },
  { name: "Maya Patel", email: "maya@university.edu", university: "University of Toronto", department: "Mathematics", yearOfStudy: 3, bio: "Math enthusiast. I break down complex concepts into simple steps.", role: "TUTOR", subjects: "MATH101 - Calculus I,MATH201 - Linear Algebra,MATH301 - Discrete Mathematics", hourlyRate: 20 },
  { name: "James Wilson", email: "james@university.edu", university: "University of Toronto", department: "Physics", yearOfStudy: 5, bio: "PhD student in Physics. Tutoring undergrad physics since 2022.", role: "TUTOR", subjects: "PHY101 - Physics I,MATH101 - Calculus I", hourlyRate: 30 },
  { name: "Sofia Rodriguez", email: "sofia@university.edu", university: "University of Toronto", department: "Chemistry", yearOfStudy: 3, bio: "Chem nerd. Here to help you survive organic chemistry!", role: "TUTOR", subjects: "CHEM101 - General Chemistry", hourlyRate: 22 },
  { name: "Liam Thompson", email: "liam@university.edu", university: "University of Toronto", department: "Economics", yearOfStudy: 2, bio: "Second-year econ student. I enjoy making abstract concepts relatable.", role: "BOTH", subjects: "ECON201 - Microeconomics,MATH101 - Calculus I", hourlyRate: 18 },
  { name: "Priya Sharma", email: "priya@university.edu", university: "University of Toronto", department: "Computer Science", yearOfStudy: 1, bio: null, role: "STUDENT", subjects: "", hourlyRate: 0 },
  { name: "Noah Davis", email: "noah@university.edu", university: "University of Toronto", department: "Mathematics", yearOfStudy: 2, bio: null, role: "STUDENT", subjects: "", hourlyRate: 0 },
];

async function main() {
  console.log("Seeding database...");
  await initDatabase();

  // Clear all data
  dbExec("DELETE FROM reviews");
  dbExec("DELETE FROM sessions");
  dbExec("DELETE FROM availability");
  dbExec("DELETE FROM tutor_profiles");
  dbExec("DELETE FROM users");

  const password = bcrypt.hashSync("password123", 10);
  const userIds = [];       // all user IDs in order
  const tutorProfileIds = []; // tutor profile IDs

  // Phase 1: Create all users and tutor profiles
  for (const u of MOCK_USERS) {
    const result = dbRun(
      "INSERT INTO users (name, email, password, university, department, year_of_study, bio, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [u.name, u.email, password, u.university, u.department, u.yearOfStudy, u.bio, u.role]
    );
    const userId = result.lastInsertRowid;
    userIds.push(userId);

    if (u.role === "TUTOR" || u.role === "BOTH") {
      const tpResult = dbRun(
        "INSERT INTO tutor_profiles (user_id, subjects, hourly_rate, is_verified) VALUES (?, ?, ?, 1)",
        [userId, u.subjects, u.hourlyRate]
      );
      tutorProfileIds.push({ userId, profileId: tpResult.lastInsertRowid, hourlyRate: u.hourlyRate, subjects: u.subjects });

      // Add availability
      [1, 3, 5].forEach((day) => {
        dbRun("INSERT INTO availability (tutor_profile_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)", [tpResult.lastInsertRowid, day, "09:00", "17:00"]);
      });
    }
  }

  // Phase 2: Create completed sessions + reviews (all users exist now)
  // Use the first student (Priya, index 5) to book sessions with all tutors
  const studentId = userIds[5]; // Priya Sharma
  const comments = [
    "Really helpful! Explained everything clearly.",
    "Great tutor, very patient and knowledgeable.",
    "Helped me understand a topic I'd been struggling with for weeks.",
    "Would definitely book again!",
  ];

  for (const tp of tutorProfileIds) {
    const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5

    const sessResult = dbRun(
      "INSERT INTO sessions (student_id, tutor_id, tutor_profile_id, subject, scheduled_date, scheduled_time, duration_minutes, status, total_cost) VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?)",
      [studentId, tp.userId, tp.profileId, tp.subjects.split(",")[0], "2025-08-01", "10:00", 60, tp.hourlyRate]
    );

    dbRun(
      "INSERT INTO reviews (session_id, reviewer_id, tutor_profile_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
      [sessResult.lastInsertRowid, studentId, tp.profileId, rating, comments[Math.floor(Math.random() * comments.length)]]
    );

    dbExec("UPDATE tutor_profiles SET avg_rating = ?, total_reviews = 1 WHERE id = ?", [rating, tp.profileId]);
  }

  console.log(`Seeded ${MOCK_USERS.length} users`);
  console.log("All passwords: password123");
  console.log("Try: alex@university.edu / password123");
}

main().catch(console.error);
