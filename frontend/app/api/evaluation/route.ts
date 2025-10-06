import { MyceliaEvaluationRequestBody } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

// NOTE: you are expected to define the following environment variables in `.env.local`:
const MYCELIA_API_KEY = process.env.MYCELIA_API_KEY;
const MYCELIA_URL = process.env.MYCELIA_URL;

// don't cache the results
export const revalidate = 0;

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

export async function POST(request: NextRequest) {
  try {
    if (!MYCELIA_API_KEY) {
      throw new Error("MyCelia API key is missing from .env");
    }
    if (!MYCELIA_URL) {
      throw new Error("MyCelia URL is missing from .env");
    }
    if (!request.body) {
      return new NextResponse(`No body given`, { status: 400 });
    }

    const requestData: MyceliaEvaluationRequestBody = await request.json();
    if (!requestData.conversation) {
      return new NextResponse(`No convesation data provided`, { status: 400 });
    }

    if (!requestData.games) {
      return new NextResponse(`No games data provided`, { status: 400 });
    }

    if (!requestData.userinfo) {
      return new NextResponse(`No userinfo provided`, { status: 400 });
    }

    // only send the necessary data
    const body = JSON.stringify({
      conversation: requestData.conversation,
      games: requestData.games,
      userinfo: requestData.userinfo,
    });

    const res = await fetch(`${MYCELIA_URL}/avatar/conversation`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MYCELIA_API_KEY}`,
        "content-type": "application/json",
      },
      body,
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error retrieving mycelia response:", error);
    return new NextResponse(`Failed to retrieve mycelia response`, { status: 500 });
  }
}
