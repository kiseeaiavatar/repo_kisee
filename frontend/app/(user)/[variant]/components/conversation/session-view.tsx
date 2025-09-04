"use client";

import { useDebugMode } from "@/hooks/useDebug";
import { Variant } from "@/lib/variants";
import { type AgentState, useRoomContext, useVoiceAssistant } from "@livekit/components-react";
import React, { useEffect } from "react";
import Avatar from "./avatar";
import { Chat } from "./livekit/chat/chat";

function isAgentAvailable(agentState: AgentState) {
  return agentState == "listening" || agentState == "thinking" || agentState == "speaking";
}

interface SessionViewProps {
  variant: Variant;
}

export const SessionView = ({ variant, ref }: React.ComponentProps<"div"> & SessionViewProps) => {
  const { state: agentState } = useVoiceAssistant();
  const room = useRoomContext();
  const isChat = variant == "chat";

  useDebugMode();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isAgentAvailable(agentState)) {
        const reason =
          agentState === "connecting"
            ? "Agent did not join the room. "
            : "Agent connected but did not complete initializing. ";

        /* toastAlert({ */
        console.error({
          title: "Session ended",
          description: (
            <p className="w-full">
              {reason}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://docs.livekit.io/agents/start/voice-ai/"
                className="whitespace-nowrap underline"
              >
                See quickstart guide
              </a>
              .
            </p>
          ),
        });
        room.disconnect();
      }
    }, 30_000);

    return () => clearTimeout(timeout);
  }, [agentState, room]);

  return (
    <main ref={ref} className="w-full">
      <div className="h-full flex flex-col px-24 py-4 justify-center">
        {isChat && <Chat />}
        {!isChat && <Avatar />}
      </div>
    </main>
  );
};
