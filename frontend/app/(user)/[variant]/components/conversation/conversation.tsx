"use client";

import useConnectionDetails from "@/hooks/useConnectionDetails";
import { EventInput, EventResult, EventType } from "@/lib/types";
import { Variant } from "@/lib/variants";
import { RoomAudioRenderer, RoomContext, StartAudio } from "@livekit/components-react";
import { Room, RoomEvent, RpcInvocationData } from "livekit-client";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ConversationProvider } from "./conversation-context";
import EventContainer from "./events/container";
import { SessionView } from "./session-view";
import Sidebar from "./sidebar";

interface ConversationProps {
  onDone?: () => void;
  onCancel?: () => void;
  variant: Variant;
}

const MotionSessionView = motion.create(SessionView);

export default function Conversation({ variant, onCancel }: ConversationProps) {
  const [room] = useState(() => new Room());
  const [eventData, setEventData] = useState<{
    type: EventType;
    input: EventInput;
  } | null>(null);

  const [chapter, setChapter] = useState("");

  const { connectionDetails, refreshConnectionDetails } = useConnectionDetails(variant);
  const isChat = variant == "chat";

  useEffect(() => {
    const onDisconnected = () => {
      onCancel?.();
      refreshConnectionDetails();
    };
    const onMediaDevicesError = (error: Error) => {
      /* toastAlert({ */
      console.log({
        title: "Encountered an error with your media devices",
        description: `${error.name}: ${error.message}`,
      });
    };
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room, refreshConnectionDetails, onCancel]);

  useEffect(() => {
    if (room.state === "disconnected" && connectionDetails) {
      Promise.all([
        room.localParticipant.setMicrophoneEnabled(!isChat, undefined),
        room.connect(connectionDetails.serverUrl, connectionDetails.participantToken),
      ])
        .then(() => {
          // Register RPC method for showing notifications
          /* room.localParticipant.registerRpcMethod("showNotification", async (data) => { */
          room.registerRpcMethod("showNotification", async (data: RpcInvocationData) => {
            let input: EventInput;
            try {
              input = typeof data.payload === "string" ? JSON.parse(data.payload) : data.payload;
            } catch {
              input = { description: data.payload };
            }

            const eventType = input.type as EventType;

            if (eventType == "chapter" && input.chapter_id) {
              setChapter(input.chapter_id);
              return Promise.resolve("");
            }

            setEventData({
              type: eventType,
              input,
            });
            return new Promise((resolve) => {
              // The promise will be resolved when the user submits the event
              window.addEventListener(
                "eventSubmitted",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (event: any) => {
                  // Ensure we're sending a properly serialized object
                  const result: string =
                    typeof event.detail === "string" ? event.detail : JSON.stringify(event.detail);
                  resolve(result);
                },
                { once: true }
              );
            });
          });
        })
        .catch((error) => {
          /* toastAlert({ */
          console.log({
            title: "There was an error connecting to the agent",
            description: `${error.name}: ${error.message}`,
          });
        });
    }
    return () => {
      if (room.state == "connected") room.disconnect();
    };
  }, [room, connectionDetails, isChat]);

  const handleCancel = () => {
    room.disconnect();
  };

  const handleEventSubmit = (result: EventResult) => {
    if (eventData?.type == "evaluation") {
      handleCancel();
      return;
    }

    setEventData(null);
    // Dispatch event to resolve the RPC promise
    window.dispatchEvent(new CustomEvent("eventSubmitted", { detail: result }));
  };

  return (
    <div className={`flex h-full bg-primary-${isChat ? 100 : 500}`}>
      <ConversationProvider>
        <RoomContext.Provider value={room}>
          <div className="flex-initial">
            <Sidebar chapter={chapter} onCancel={handleCancel} />
          </div>
          <div className="center flex flex-1 justify-center">
            <RoomAudioRenderer muted={isChat} />
            <StartAudio label="Start Audio" />
            <MotionSessionView
              key="session-view"
              variant={variant}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.5,
                ease: "linear",
                delay: 0.5,
              }}
            />
          </div>
          {eventData && (
            <div className="shadow-[-4px_4px_16px_rgba(0,0,0,0.15)] bg-primary-200 text-primary-500 flex-1 rounded-l-3xl p-4">
              <EventContainer
                eventType={eventData.type}
                eventInput={eventData.input}
                onSubmit={handleEventSubmit}
              />
            </div>
          )}
        </RoomContext.Provider>
      </ConversationProvider>
    </div>
  );
}
