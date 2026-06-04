import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");

    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }

    const db = getFirestore();
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userData = userDoc.data();
    const dna = userData.fighterDNA;
    const streak = userData.dailyStreak || 0;

    // Get last 7 days of training sessions
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const sessionsSnap = await db
      .collection("training_sessions")
      .where("userId", "==", userId)
      .where("createdAt", ">=", weekAgo)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const sessions = sessionsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const sessionCount = sessions.length;
    const avgScore = sessionCount > 0
      ? sessions.reduce((s, d) => s + (d.score || 0), 0) / sessionCount
      : 0;
    const bestScore = sessionCount > 0
      ? Math.max(...sessions.map((d) => d.score || 0))
      : 0;

    return NextResponse.json({
      userId,
      archetype: dna?.archetypeKey || null,
      confidence: dna?.confidence || 0,
      styleMix: dna?.styleMix || null,
      streak,
      weeklyStats: {
        sessionCount,
        avgScore: Math.round(avgScore * 10) / 10,
        bestScore: Math.round(bestScore * 10) / 10,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("DNA report error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
