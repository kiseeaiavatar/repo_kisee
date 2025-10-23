import useChatAndTranscription from "@/hooks/useChatAndTranscription";
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
  VoiceAssistantControlBar,
  useRoomContext,
  useTrackToggle,
} from "@livekit/components-react";
import { RoomEvent, Track } from "livekit-client";
import Image from "next/image";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import ConversationContext from "../../conversation-context";
import { AvatarVideo } from "./AvatarSession/AvatarVideo";
import { StreamingAvatarProvider, StreamingAvatarSessionState } from "./logic";
import { useStreamingAvatarContext } from "./logic/context";
import { useStreamingAvatarSession } from "./logic/useStreamingAvatarSession";
import { useTextChat } from "./logic/useTextChat";

const AVATARS = [
  {
    avatar_id: "Marianne_Chair_Sitting_public",
    name: "Marianne Chair",
  },
  {
    avatar_id: "Pedro_Chair_Sitting_public",
    name: "Pedro Chair",
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
  activityIdleTimeout: 3599, // one hour
};

const HEYGEN_TEXT_WORD_COUNT = 10;

function InteractiveAvatar({ avatar }: { avatar: number }) {
  const { initAvatar, startAvatar, sessionState, stopAvatar, stream } = useStreamingAvatarSession();
  const { avatarTalkingCnt } = useStreamingAvatarContext();
  const { setMessages } = useContext(ConversationContext);
  const [error, setError] = useState("");

  const { repeatMessageSync } = useTextChat();

  const { accessToken: heygenToken } = useHeygenAccessToken();
  const { messages } = useChatAndTranscription();

  const room = useRoomContext();

  useEffect(() => {
    const onDisconnected = () => {
      stopAvatar();
    };
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
    };
  }, [room, stopAvatar]);

  const { toggle: toggleMic } = useTrackToggle({
    source: Track.Source.Microphone,
  });

  useEffect(() => {
    setMessages(messages);
  });

  useEffect(() => {
    if (avatarTalkingCnt == 0) {
      toggleMic(true);
    } else {
      toggleMic(false);
    }
  }, [avatarTalkingCnt, toggleMic]);

  const mediaStream = useRef<HTMLVideoElement>(null);

  const startSessionV2 = useCallback(
    async (token: string) => {
      try {
        initAvatar(token);
        await startAvatar({
          ...DEFAULT_CONFIG,
          avatarName: AVATARS[avatar].avatar_id,
        });
      } catch (error: unknown) {
        console.error("Error starting avatar session:", error);
        if (error.responseText) {
          try {
            const errResponse = JSON.parse(error.responseText);
            setError(`${error} (${errResponse.message})`);
          } catch {
            setError(`${error} (unknown)`);
          }
        } else {
          setError(`${error} (unexpected)`);
        }
      }
    },
    [initAvatar, startAvatar, avatar]
  );

  useEffect(() => {
    if (sessionState === StreamingAvatarSessionState.INACTIVE && heygenToken) {
      startSessionV2(heygenToken);
    }
  }, [heygenToken, sessionState, startSessionV2]);

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current?.play();
      };
    }
  }, [mediaStream, stream]);

  async function sendToHeygen(text: string) {
    console.log(`Sending: ${text}`);
    return repeatMessageSync(text);
  }

  // Tracks how many words have already been sent per message
  const sentWordCountRef = useRef<Record<string, number>>({});
  // Debounce timers for flushing leftovers
  const flushTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  // Outgoing queue for buffered delivery. Collects chunks which are sent out every X ms.
  // This avoids disordering caused by overlapping async calls.
  const queueRef = useRef<{ id: string; text: string }[]>([]);
  const isFlushingRef = useRef(false);

  // Interval fallback (batch flush every 500ms)
  useEffect(() => {
    const interval = setInterval(() => flushQueue(), 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState]); // no flushQueue here

  function flushQueue() {
    if (sessionState !== StreamingAvatarSessionState.CONNECTED) return;
    if (queueRef.current.length === 0 || isFlushingRef.current) return;

    isFlushingRef.current = true;
    const batch = [...queueRef.current];
    queueRef.current = [];

    const mergedText = batch.reduce((acc, chunk) => {
      return `${acc} ${chunk.text}`;
    }, "");

    if (mergedText.trim().length > 0) {
      sendToHeygen(mergedText).finally(() => {
        isFlushingRef.current = false;
      });
    } else {
      isFlushingRef.current = false;
    }
  }

  function enqueueChunk(id: string, text: string) {
    console.log("enqueue chunk", id, text);
    const wasEmpty = queueRef.current.length === 0;
    queueRef.current.push({ id, text });
    if (wasEmpty && !isFlushingRef.current) {
      // send immediately if queue was empty before
      // but only if we're not already flushing
      flushQueue();
    }
  }

  useEffect(() => {
    messages
      .filter((msg) => {
        // filter user messages (and those without a `from` property)
        const isUser = msg.from?.isLocal ?? true;
        return !isUser;
      })
      .forEach((msg) => {
        // split into whole words and filter empty strings
        const words = msg.message.trim().split(/\s+/).filter(Boolean);
        let alreadySent = sentWordCountRef.current[msg.id] ?? 0;

        // Only send in blocks of X, but require at least X+1 words ahead
        while (words.length - alreadySent >= HEYGEN_TEXT_WORD_COUNT + 1) {
          const chunk = words.slice(alreadySent, alreadySent + HEYGEN_TEXT_WORD_COUNT).join(" ");
          enqueueChunk(msg.id, chunk);
          alreadySent += HEYGEN_TEXT_WORD_COUNT; // increment local counter
          sentWordCountRef.current[msg.id] = alreadySent; // update ref
        }

        // Debounced flush for leftovers (<X words or trailing incomplete word)
        if (flushTimersRef.current[msg.id]) {
          clearTimeout(flushTimersRef.current[msg.id]);
        }
        flushTimersRef.current[msg.id] = setTimeout(() => {
          const sent = sentWordCountRef.current[msg.id] ?? 0;
          if (words.length > sent) {
            const leftover = words.slice(sent).join(" ");
            if (leftover) {
              enqueueChunk(msg.id, leftover);
              sentWordCountRef.current[msg.id] = words.length;
            }
          }
        }, 500);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]); // we don't want enqueueChunk here

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col rounded-xl bg-primary-400 overflow-hidden text-white">
        <div className="relative w-full aspect-video overflow-hidden flex flex-col items-center justify-center">
          {sessionState === StreamingAvatarSessionState.CONNECTED ? (
            <AvatarVideo ref={mediaStream} />
          ) : (
            <>
              <div className="flex flex-col items-center">
                <Image
                  className="m-auto"
                  src={`/avatar-variant-${avatar + 1}.jpg`}
                  alt={`avatar-variant-${avatar + 1}`}
                  width={512}
                  height={512}
                  style={{ width: "512px", height: "512px" }}
                  priority
                />
                <div className="p-4">
                  Einen Moment Geduld, bitte.
                  <br />
                  Avatar wird geladen...
                  {error && (
                    <>
                      <br />
                      {error}
                    </>
                  )}
                </div>
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
    <StreamingAvatarProvider
      basePath={process.env.NEXT_PUBLIC_HEYGEN_API_BASE_URL ?? "https://api.heygen.com"}
    >
      <InteractiveAvatar avatar={avatar} />
    </StreamingAvatarProvider>
  );
}
