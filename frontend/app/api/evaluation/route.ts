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

// --url http://49.12.65.167:3003/api/avatar/conversation \
// --header 'Authorization: Bearer ' \
export async function POST(request: NextRequest) {
  console.log("evaluation request", request);
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

    const requestData = await request.json();
    if (!requestData.conversation) {
      return new NextResponse(`No convesation data provided`, { status: 400 });
    }

    if (!requestData.games) {
      return new NextResponse(`No games data provided`, { status: 400 });
    }

    console.log("evaluation requestData", requestData);

    const res = await fetch(`${MYCELIA_URL}/avatar/conversation`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MYCELIA_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        conversation: requestData.conversation,
        games: requestData.games,
      }),
    });

    const data = await res.json();
    console.log("mycelia response", data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error retrieving mycelia response:", error);
    return new NextResponse(`Failed to retrieve mycelia response`, { status: 500 });
  }
}
