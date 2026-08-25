// API route: GET /api/tutors
// Returns a list of tutors, optionally filtered by subject or department

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject") || "";
    const department = searchParams.get("department") || "";
    const minRating = parseFloat(searchParams.get("minRating") || "0");

    // Fetch all tutor profiles with user info
    const tutors = await db.tutorProfile.findMany({
      where: {
        // Filter by department if provided
        ...(department && {
          user: { department: { contains: department } },
        }),
        // Filter by minimum rating
        avgRating: { gte: minRating },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            university: true,
            department: true,
            yearOfStudy: true,
            bio: true,
          },
        },
        availability: true,
        reviews: {
          take: 3, // Only show the latest 3 reviews on listing
          orderBy: { createdAt: "desc" },
          include: {
            reviewer: { select: { name: true } },
          },
        },
      },
      orderBy: { avgRating: "desc" },
    });

    // If a subject filter was given, filter in memory
    // (subjects are stored as a comma-separated string)
    const filtered = subject
      ? tutors.filter((t) =>
          t.subjects
            .toLowerCase()
            .split(",")
            .some((s) => s.trim().includes(subject.toLowerCase()))
        )
      : tutors;

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching tutors:", error);
    return NextResponse.json(
      { error: "Could not load tutors" },
      { status: 500 }
    );
  }
}
