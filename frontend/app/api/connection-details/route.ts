import { ALL_VARIANTS, Variant } from "@/lib/variants";
import { RoomAgentDispatch, RoomConfiguration } from "@livekit/protocol";
import { AccessToken, type AccessTokenOptions, type VideoGrant } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

// NOTE: you are expected to define the following environment variables in `.env.local`:
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const APP_ENV = process.env.APP_ENV ?? "development";

// don't cache the results
export const revalidate = 0;

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

export async function GET(request: NextRequest) {
  const variantParam = request.nextUrl.searchParams.get("variant");
  const variant = ALL_VARIANTS.find((v) => v == variantParam);
  if (!variant) return new NextResponse("bad variant given", { status: 400 });

  try {
    if (LIVEKIT_URL === undefined) {
      throw new Error("LIVEKIT_URL is not defined");
    }
    if (API_KEY === undefined) {
      throw new Error("LIVEKIT_API_KEY is not defined");
    }
    if (API_SECRET === undefined) {
      throw new Error("LIVEKIT_API_SECRET is not defined");
    }

    // Generate participant token
    const participantIdentity = `voice_assistant_user`;
    // TODO make sure room name is unique
    const roomName = `voice_assistant_room_${Math.floor(Math.random() * 1_000_000)}`;
    const participantToken = await createParticipantToken(
      { identity: participantIdentity },
      roomName,
      variant
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName: participantIdentity,
    };
    const headers = new Headers({
      "Cache-Control": "no-store",
    });
    return NextResponse.json(data, { headers });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

function createParticipantToken(userInfo: AccessTokenOptions, roomName: string, variant: Variant) {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: "15m",
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);
  at.roomConfig = new RoomConfiguration({
    agents: [
      new RoomAgentDispatch({
        agentName: `kisee-agent-${APP_ENV}`,
        metadata: `{"subject_id": "12345", "variant":"${variant}", "avatar_id": ""}`,
      }),
    ],
  });
  return at.toJwt();
}
