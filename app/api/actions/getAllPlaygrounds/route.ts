import { NextResponse } from "next/server";
import { getAllPlaygroundForUser } from "@/features/playground/actions";

export async function GET() {
  try {
    const playgrounds = await getAllPlaygroundForUser();

    const formattedPlaygrounds = playgrounds.map((playground) => ({
      id: playground.id,
      title: playground.title,
    }));

    return NextResponse.json(formattedPlaygrounds);
  } catch (error) {
    console.error("Error in getAllPlaygrounds API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch playgrounds" },
      { status: 500 }
    );
  }
}
