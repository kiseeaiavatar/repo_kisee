import useHeygenAccessToken from "@/hooks/useHeygenAccessToken";
import {
  AvatarQuality,
  ElevenLabsModel,
  STTProvider,
  StartAvatarRequest,
  VoiceChatTransport,
  VoiceEmotion,
} from "@heygen/streaming-avatar";
import {
  type TextStreamData,
  VoiceAssistantControlBar,
  useTranscriptions,
} from "@livekit/components-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AvatarVideo } from "./AvatarSession/AvatarVideo";
import { StreamingAvatarProvider, StreamingAvatarSessionState } from "./logic";
import { useStreamingAvatarSession } from "./logic/useStreamingAvatarSession";
import { useTextChat } from "./logic/useTextChat";

const AVATARS = [
  {
    avatar_id: "Anastasia_Chair_Sitting_public",
    name: "Anastasia Chair",
  },
  {
    avatar_id: "Anthony_Chair_Sitting_public",
    name: "Anthony Chair",
  },
];

const DEFAULT_CONFIG: StartAvatarRequest = {
  quality: AvatarQuality.Medium,
  avatarName: AVATARS[0].avatar_id,
  knowledgeId: undefined,
  voice: {
    rate: 1.5,
    emotion: VoiceEmotion.FRIENDLY,
    model: ElevenLabsModel.eleven_flash_v2_5,
  },
  language: "de",
  voiceChatTransport: VoiceChatTransport.WEBSOCKET,
  sttSettings: {
    provider: STTProvider.DEEPGRAM,
  },
};

function InteractiveAvatar({ avatar }: { avatar: number }) {
  const { initAvatar, startAvatar, stopAvatar, sessionState, stream } = useStreamingAvatarSession();

  const { repeatMessageSync } = useTextChat();

  const [config] = useState<StartAvatarRequest>({
    ...DEFAULT_CONFIG,
    avatarName: AVATARS[avatar].avatar_id,
  });

  const [handledTranscriptions, setHandledTranscriptions] = useState<string[]>([]);
  const { accessToken: heygenToken } = useHeygenAccessToken();

  const transcriptions: TextStreamData[] = useTranscriptions();

  const mediaStream = useRef<HTMLVideoElement>(null);

  const startSessionV2 = useCallback(
    async (token: string) => {
      try {
        initAvatar(token);
        await startAvatar(config);
      } catch (error) {
        console.error("Error starting avatar session:", error);
      }
    },
    [initAvatar, startAvatar, config]
  );

  useEffect(() => {
    if (sessionState === StreamingAvatarSessionState.INACTIVE && heygenToken) {
      startSessionV2(heygenToken);
    }
    return () => {
      if (sessionState === StreamingAvatarSessionState.CONNECTED && heygenToken) {
        stopAvatar();
      }
    };
  }, [heygenToken, sessionState]);

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
      };
    }
  }, [mediaStream, stream]);

  useEffect(() => {
    transcriptions.map((t) => {
      if (handledTranscriptions.includes(t.streamInfo.id)) {
        return;
      }

      const isFinal = t.streamInfo.attributes["lk.transcription_final"] === "true";
      const isUser = t.participantInfo.identity === "voice_assistant_user";
      if (!isUser) console.debug(`transcription: ${t.text} (final: ${isFinal})`);
    });

    // timeout required to ensure transcriptions are marked "final"
    // TODO improvement idea: send text to heygen once a dot, exclamation mark, ... is detected
    const timeout = setTimeout(() => {
      if (sessionState === StreamingAvatarSessionState.CONNECTED) {
        let handled = [...handledTranscriptions];
        transcriptions.map((t) => {
          if (handled.includes(t.streamInfo.id)) {
            /* console.log("already handled", t.streamInfo.id); */
            return;
          }

          const isFinal = t.streamInfo.attributes["lk.transcription_final"] === "true";
          const isUser = t.participantInfo.identity === "voice_assistant_user";
          if (isFinal && !isUser) {
            handled = [...handled, t.streamInfo.id];
            console.debug("-> sending final text to heygen", t.text, t.streamInfo.id);
            repeatMessageSync(t.text);
          }
        });
        setHandledTranscriptions(handled);
      }
    }, 1000);
    return () => {
      clearTimeout(timeout);
    };
  }, [transcriptions, sessionState, handledTranscriptions, repeatMessageSync]);

  /* TODO
   * - avatar select */

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col rounded-xl bg-primary-400 overflow-hidden text-white">
        <div className="relative w-full aspect-video overflow-hidden flex flex-col items-center justify-center">
          {sessionState !== StreamingAvatarSessionState.INACTIVE ? (
            <AvatarVideo ref={mediaStream} />
          ) : (
            <>
              <div className="flex flex-auto">
                <Image
                  className="m-auto"
                  src="/avatar-1.png"
                  alt="avatar-1"
                  width={512}
                  height={512}
                  style={{ width: "512px", height: "512px" }}
                  priority
                />
                <div>Lade Avatar...</div>
              </div>
            </>
          )}
        </div>
      </div>
      <VoiceAssistantControlBar className="" controls={{ leave: false }} />
    </div>
  );
}

interface AvatarProps {
  avatar: number;
}

export default function InteractiveAvatarWrapper({ avatar }: AvatarProps) {
  return (
    <StreamingAvatarProvider basePath={process.env.NEXT_PUBLIC_BASE_API_URL}>
      <InteractiveAvatar avatar={avatar} />
    </StreamingAvatarProvider>
  );
}
