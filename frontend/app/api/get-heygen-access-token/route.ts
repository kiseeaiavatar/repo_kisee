import { NextRequest, NextResponse } from "next/server";

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const HEYGEN_API_BASE_URL = process.env.NEXT_PUBLIC_HEYGEN_API_BASE_URL ?? "https://api.heygen.com";

export async function POST(_request: NextRequest) {
  try {
    if (!HEYGEN_API_KEY) {
      throw new Error("API key is missing from .env");
    }

    const res = await fetch(`${HEYGEN_API_BASE_URL}/v1/streaming.create_token`, {
      method: "POST",
      headers: {
        "x-api-key": HEYGEN_API_KEY,
      },
    });

    const data = await res.json();
    const headers = new Headers({
      "Cache-Control": "no-store",
    });
    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error("Error retrieving access token:", error);
    if (error instanceof Error) {
      return new NextResponse(`Failed to retrieve access token: ${error.message}`, {
        status: 500,
      });
    }
    return new NextResponse(`Failed to retrieve access token`, { status: 500 });
  }
}
