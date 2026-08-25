// API route: POST /api/reviews
// Submits a review after a completed session

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const reviewSchema = z.object({
  sessionId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { sessionId, rating, comment } = parsed.data;

    // Find the session and make sure it's completed
    const bookingSession = await db.session.findUnique({
      where: { id: sessionId },
      include: { review: true },
    });

    if (!bookingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (bookingSession.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "You can only review completed sessions" },
        { status: 400 }
      );
    }

    // Make sure it's the student who booked the session
    if (bookingSession.studentId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the student can review a session" },
        { status: 403 }
      );
    }

    // Prevent duplicate reviews
    if (bookingSession.review) {
      return NextResponse.json(
        { error: "You have already reviewed this session" },
        { status: 400 }
      );
    }

    // Create the review
    const review = await db.review.create({
      data: {
        sessionId,
        reviewerId: session.user.id,
        tutorProfileId: bookingSession.tutorProfileId,
        rating,
        comment: comment || null,
      },
    });

    // Update the tutor's average rating
    const allReviews = await db.review.findMany({
      where: { tutorProfileId: bookingSession.tutorProfileId },
    });

    const newAvg =
      allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / allReviews.length;

    await db.tutorProfile.update({
      where: { id: bookingSession.tutorProfileId },
      data: {
        avgRating: Math.round(newAvg * 10) / 10, // round to 1 decimal
        totalReviews: allReviews.length,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Review error:", error);
    return NextResponse.json(
      { error: "Could not submit review" },
      { status: 500 }
    );
  }
}
