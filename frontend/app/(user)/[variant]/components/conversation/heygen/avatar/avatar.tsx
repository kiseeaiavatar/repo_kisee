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
    emotion: VoiceEmotion.SERIOUS,
    model: ElevenLabsModel.eleven_flash_v2_5,
  },
  language: "de",
  voiceChatTransport: VoiceChatTransport.WEBSOCKET,
  sttSettings: {
    provider: STTProvider.DEEPGRAM,
  },
  activityIdleTimeout: 900, // 15 minutes
};

const HEYGEN_TEXT_WORD_COUNT = 10;
const QUEUE_SWITCH_GRACE_PERIOD_MS = 1500;

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
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

  const sendToHeygen = useCallback(
    async function (text: string, id: string) {
      console.log(new Date().toLocaleTimeString(), " ===> sending message", id, text);
      return repeatMessageSync(text);
    },
    [repeatMessageSync]
  );
  // Track words already sent per message
  const sentWordCountRef = useRef<Record<string, number>>({});
  // Per-message debounce timers for leftover flush
  const flushTimersRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Message ordering and queuing
  const messageQueuesRef = useRef<Map<string, { text: string }[]>>(new Map());
  const messageOrderRef = useRef<string[]>([]);
  const currentMessageRef = useRef<string | null>(null);
  const switchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFlushingRef = useRef(false);

  // --- Enqueue chunks ---
  function enqueueChunk(id: string, text: string) {
    console.log(new Date().toLocaleTimeString(), "enqueue chunk", id, text);

    if (!messageQueuesRef.current.has(id)) {
      messageQueuesRef.current.set(id, []);
      messageOrderRef.current.push(id);
    }

    messageQueuesRef.current.get(id)!.push({ text });

    // Cancel pending switch if new chunks arrive for current message
    if (switchTimerRef.current && currentMessageRef.current === id) {
      clearTimeout(switchTimerRef.current);
      switchTimerRef.current = null;
    }

    // Start flushing if idle
    if (!isFlushingRef.current) {
      flushNextMessageQueue();
    }
  }

  // --- Message watcher ---
  useEffect(() => {
    messages
      .filter((msg) => {
        // filter non-user messages
        const isUser = msg.from?.isLocal ?? true;
        return !isUser;
      })
      .forEach((msg) => {
        const words = msg.message.trim().split(/\s+/).filter(Boolean);
        let alreadySent = sentWordCountRef.current[msg.id] ?? 0;

        // Send full 5-word chunks
        while (words.length - alreadySent >= HEYGEN_TEXT_WORD_COUNT + 1) {
          const chunk = words.slice(alreadySent, alreadySent + HEYGEN_TEXT_WORD_COUNT).join(" ");
          enqueueChunk(msg.id, chunk);
          alreadySent += HEYGEN_TEXT_WORD_COUNT;
          sentWordCountRef.current[msg.id] = alreadySent;
        }

        // Debounced flush for leftovers
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
  }, [messages]);

  // --- Flush logic ---
  const flushNextMessageQueue = useCallback(
    async function () {
      if (sessionState !== StreamingAvatarSessionState.CONNECTED) return;
      if (isFlushingRef.current) return;

      const currentId = currentMessageRef.current || messageOrderRef.current[0];
      if (!currentId) return;

      const queue = messageQueuesRef.current.get(currentId);
      if (!queue || queue.length === 0) {
        // queue empty → wait before moving on
        if (!switchTimerRef.current) {
          switchTimerRef.current = setTimeout(() => {
            const q = messageQueuesRef.current.get(currentId);
            if (!q || q.length === 0) {
              // finalize and move to next message
              messageQueuesRef.current.delete(currentId);
              messageOrderRef.current.shift();
              currentMessageRef.current = null;
              switchTimerRef.current = null;
              flushNextMessageQueue(); // continue with next message
            } else {
              // new chunks arrived during grace period → continue with same message
              switchTimerRef.current = null;
              flushNextMessageQueue();
            }
          }, QUEUE_SWITCH_GRACE_PERIOD_MS);
        }
        return;
      }

      // process next batch
      isFlushingRef.current = true;
      currentMessageRef.current = currentId;

      const batch = queue.splice(0, queue.length);
      const mergedText = batch.map((c) => c.text).join(" ");

      if (mergedText.trim().length > 0) {
        try {
          await sendToHeygen(mergedText, currentId);
        } catch (err) {
          console.error("Failed to send chunk:", err);
        }
      }

      isFlushingRef.current = false;
      flushNextMessageQueue(); // continue draining current message
    },
    [sendToHeygen, sessionState]
  );

  useEffect(() => {
    if (sessionState !== StreamingAvatarSessionState.CONNECTED) return;
    flushNextMessageQueue();
  }, [sessionState, flushNextMessageQueue]);

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
