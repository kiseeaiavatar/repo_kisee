import { NextRequest, NextResponse } from "next/server";

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

export async function POST(_request: NextRequest) {
  try {
    if (!HEYGEN_API_KEY) {
      throw new Error("API key is missing from .env");
    }
    const baseApiUrl = process.env.NEXT_PUBLIC_BASE_API_URL;

    const res = await fetch(`${baseApiUrl}/v1/streaming.create_token`, {
      method: "POST",
      headers: {
        "x-api-key": HEYGEN_API_KEY,
      },
    });

    const data = await res.json();
    console.log("create_token response", data);

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
