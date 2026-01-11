import { NextRequest, NextResponse } from "next/server";
import { getBadgeByLevel } from "@/lib/badges";

export async function GET(
  request: NextRequest,
  { params }: { params: { level: string } }
) {
  try {
    const level = parseInt(params.level);

    if (isNaN(level) || level < 1) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    }

    const badge = await getBadgeByLevel(level);

    if (!badge) {
      return NextResponse.json(
        { error: "Badge not found for this level" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      badge: {
        id: badge.badge_id,
        name: badge.nama,
        imageUrl: badge.gambar,
        levelMin: badge.level_min,
        levelMax: badge.level_max,
      },
    });
  } catch (error) {
    console.error("Error fetching badge by level:", error);
    return NextResponse.json(
      { error: "Failed to fetch badge" },
      { status: 500 }
    );
  }
}
