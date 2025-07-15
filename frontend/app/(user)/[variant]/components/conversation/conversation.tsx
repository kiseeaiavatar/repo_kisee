"use client";

import useConnectionDetails from "@/hooks/useConnectionDetails";
import { Variant } from "@/lib/variants";
import { RoomAudioRenderer, RoomContext, StartAudio } from "@livekit/components-react";
import { Room, RoomEvent } from "livekit-client";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import EventContainer from "./events/container";
import { SessionView } from "./session-view";
import Sidebar from "./sidebar";

interface ConversationProps {
  onDone?: () => void;
  onCancel?: () => void;
  variant: Variant;
}

interface EventPayload {
  type?: string;
  items?: string[];
  description?: string;
  [key: string]: any;
}

const MotionSessionView = motion.create(SessionView);

export default function Conversation({ variant, onCancel }: ConversationProps) {
  const [room] = useState(() => new Room());
  /*FIXME clean up sessionStarted  */
  const [sessionStarted, setSessionStarted] = useState(true);
  const [eventData, setEventData] = useState<{
    type: string;
    input: EventPayload;
  } | null>(null);

  const { connectionDetails, refreshConnectionDetails } = useConnectionDetails(variant);
  const isChat = variant == "chat";

  useEffect(() => {
    const onDisconnected = () => {
      setSessionStarted(false);
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
  }, [room, refreshConnectionDetails]);

  useEffect(() => {
    if (sessionStarted && room.state === "disconnected" && connectionDetails) {
      Promise.all([
        room.localParticipant.setMicrophoneEnabled(!isChat, undefined),
        room.connect(connectionDetails.serverUrl, connectionDetails.participantToken),
      ])
        .then(() => {
          // Register RPC method for showing notifications
          /* room.localParticipant.registerRpcMethod("showNotification", async (data) => { */
          room.registerRpcMethod("showNotification", async (data) => {
            console.log("showNotification raw", data);

            let payload: EventPayload;
            try {
              payload = typeof data.payload === "string" ? JSON.parse(data.payload) : data.payload;
            } catch {
              payload = { description: data.payload };
            }
            console.log("showNotification", payload);

            setEventData({
              type: payload.type || "notification",
              input: payload,
            });
            return new Promise((resolve) => {
              // The promise will be resolved when the user submits the event
              window.addEventListener(
                "eventSubmitted",
                (event: any) => {
                  // Ensure we're sending a properly serialized object
                  const result =
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
  }, [room, sessionStarted, connectionDetails]);

  const handleCancel = () => {
    room.disconnect();
  };

  const handleEventSubmit = (results: any) => {
    setEventData(null);
    // Dispatch event to resolve the RPC promise
    window.dispatchEvent(new CustomEvent("eventSubmitted", { detail: results }));
  };

  return (
    <div className={`flex h-full bg-primary-${isChat ? 100 : 500}`}>
      <RoomContext.Provider value={room}>
        <div className="flex-initial">
          <Sidebar onCancel={handleCancel} />
        </div>
        <div className="center flex flex-1 justify-center">
          <RoomAudioRenderer muted={isChat} />
          <StartAudio label="Start Audio" />
          {/* --- */}
          <MotionSessionView
            key="session-view"
            variant={variant}
            disabled={!sessionStarted}
            sessionStarted={sessionStarted}
            initial={{ opacity: 0 }}
            animate={{ opacity: sessionStarted ? 1 : 0 }}
            transition={{
              duration: 0.5,
              ease: "linear",
              delay: sessionStarted ? 0.5 : 0,
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
    </div>
  );
}
