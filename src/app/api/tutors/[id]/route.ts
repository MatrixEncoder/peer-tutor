// API route: GET /api/tutors/[id]
// Returns a single tutor's full profile

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tutor = await db.tutorProfile.findUnique({
      where: { id },
      include: {
        user: true,
        availability: true,
        reviews: {
          include: {
            reviewer: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    return NextResponse.json(tutor);
  } catch (error) {
    console.error("Error fetching tutor:", error);
    return NextResponse.json(
      { error: "Could not load tutor profile" },
      { status: 500 }
    );
  }
}
