// Database seed script — run with: npx prisma db seed
// Populates the database with realistic mock data for testing.

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import path from "path";

const adapter = new PrismaBetterSqlite3({
  url: `file:${path.resolve(__dirname, "dev.db")}`,
});
const db = new PrismaClient({ adapter } as any);


const SUBJECTS = [
  "CS101 - Intro to Programming",
  "CS201 - Data Structures",
  "CS301 - Algorithms",
  "CS401 - Operating Systems",
  "MATH101 - Calculus I",
  "MATH201 - Linear Algebra",
  "MATH301 - Discrete Mathematics",
  "PHY101 - Physics I",
  "CHEM101 - General Chemistry",
  "ECON201 - Microeconomics",
];

const MOCK_USERS = [
  {
    name: "Alex Chen",
    email: "alex@university.edu",
    university: "University of Toronto",
    department: "Computer Science",
    yearOfStudy: 4,
    bio: "4th year CS student. Love algorithms and competitive programming. Happy to help with any CS courses!",
    role: "BOTH" as const,
    subjects: "CS101 - Intro to Programming,CS201 - Data Structures,CS301 - Algorithms",
    hourlyRate: 25,
  },
  {
    name: "Maya Patel",
    email: "maya@university.edu",
    university: "University of Toronto",
    department: "Mathematics",
    yearOfStudy: 3,
    bio: "Math enthusiast. I break down complex concepts into simple steps.",
    role: "TUTOR" as const,
    subjects: "MATH101 - Calculus I,MATH201 - Linear Algebra,MATH301 - Discrete Mathematics",
    hourlyRate: 20,
  },
  {
    name: "James Wilson",
    email: "james@university.edu",
    university: "University of Toronto",
    department: "Physics",
    yearOfStudy: 5,
    bio: "PhD student in Physics. Tutoring undergrad physics since 2022.",
    role: "TUTOR" as const,
    subjects: "PHY101 - Physics I,MATH101 - Calculus I",
    hourlyRate: 30,
  },
  {
    name: "Sofia Rodriguez",
    email: "sofia@university.edu",
    university: "University of Toronto",
    department: "Chemistry",
    yearOfStudy: 3,
    bio: "Chem nerd. Here to help you survive organic chemistry!",
    role: "TUTOR" as const,
    subjects: "CHEM101 - General Chemistry",
    hourlyRate: 22,
  },
  {
    name: "Liam Thompson",
    email: "liam@university.edu",
    university: "University of Toronto",
    department: "Economics",
    yearOfStudy: 2,
    bio: "Second-year econ student. I enjoy making abstract concepts relatable.",
    role: "BOTH" as const,
    subjects: "ECON201 - Microeconomics,MATH101 - Calculus I",
    hourlyRate: 18,
  },
  // Students
  {
    name: "Priya Sharma",
    email: "priya@university.edu",
    university: "University of Toronto",
    department: "Computer Science",
    yearOfStudy: 1,
    bio: null,
    role: "STUDENT" as const,
    subjects: "",
    hourlyRate: 0,
  },
  {
    name: "Noah Davis",
    email: "noah@university.edu",
    university: "University of Toronto",
    department: "Mathematics",
    yearOfStudy: 2,
    bio: null,
    role: "STUDENT" as const,
    subjects: "",
    hourlyRate: 0,
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data in order (respect foreign keys)
  await db.review.deleteMany();
  await db.session.deleteMany();
  await db.availability.deleteMany();
  await db.tutorProfile.deleteMany();
  await db.user.deleteMany();

  const password = await bcrypt.hash("password123", 10);

  const createdUsers: Record<string, string> = {}; // name → userId

  // Create all users
  for (const userData of MOCK_USERS) {
    const user = await db.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password,
        university: userData.university,
        department: userData.department,
        yearOfStudy: userData.yearOfStudy,
        bio: userData.bio,
        role: userData.role,
      },
    });

    createdUsers[userData.name] = user.id;

    // Create tutor profile if applicable
    if (userData.role === "TUTOR" || userData.role === "BOTH") {
      const tutorProfile = await db.tutorProfile.create({
        data: {
          userId: user.id,
          hourlyRate: userData.hourlyRate,
          subjects: userData.subjects,
          isVerified: true,
        },
      });

      // Add availability slots
      const days = [1, 3, 5]; // Mon, Wed, Fri
      for (const day of days) {
        await db.availability.create({
          data: {
            tutorProfileId: tutorProfile.id,
            dayOfWeek: day,
            startTime: "09:00",
            endTime: "17:00",
          },
        });
      }

      // Add some mock completed sessions with reviews
      const studentId = Object.values(createdUsers).find(
        (id) => id !== user.id
      );
      if (studentId) {
        const session = await db.session.create({
          data: {
            studentId,
            tutorProfileId: tutorProfile.id,
            tutorId: user.id,
            subject: userData.subjects.split(",")[0],
            scheduledDate: "2025-08-01",
            scheduledTime: "10:00",
            durationMinutes: 60,
            status: "COMPLETED",
            totalCost: userData.hourlyRate,
          },
        });

        // Add a review for each completed session
        const review = await db.review.create({
          data: {
            sessionId: session.id,
            reviewerId: studentId,
            tutorProfileId: tutorProfile.id,
            rating: Math.floor(Math.random() * 2) + 4, // 4 or 5
            comment: [
              "Really helpful! Explained everything clearly.",
              "Great tutor, very patient and knowledgeable.",
              "Helped me understand a topic I'd been struggling with for weeks.",
              "Would definitely book again!",
            ][Math.floor(Math.random() * 4)],
          },
        });

        // Update the tutor's average rating
        await db.tutorProfile.update({
          where: { id: tutorProfile.id },
          data: {
            avgRating: review.rating,
            totalReviews: 1,
          },
        });
      }
    }
  }

  console.log(`✅ Seeded ${MOCK_USERS.length} users`);
  console.log("   All passwords set to: password123");
  console.log("   Try logging in with: alex@university.edu / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
