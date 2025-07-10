"use client";

import { Chat } from "@/components/livekit/chat/chat";
import { useDebugMode } from "@/hooks/useDebug";
import { Variant } from "@/lib/variants";
import {
  type AgentState,
  VoiceAssistantControlBar,
  useRoomContext,
  useVoiceAssistant,
} from "@livekit/components-react";
import { motion } from "motion/react";
import React, { useEffect } from "react";

function isAgentAvailable(agentState: AgentState) {
  return agentState == "listening" || agentState == "thinking" || agentState == "speaking";
}

interface SessionViewProps {
  disabled: boolean;
  sessionStarted: boolean;
  variant: Variant;
}

export const SessionView = ({
  variant,
  disabled,
  sessionStarted,
  ref,
}: React.ComponentProps<"div"> & SessionViewProps) => {
  const { state: agentState } = useVoiceAssistant();
  const room = useRoomContext();
  const isChat = variant == "chat";

  useDebugMode();

  useEffect(() => {
    if (sessionStarted) {
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
      }, 10_000);

      return () => clearTimeout(timeout);
    }
  }, [agentState, sessionStarted, room]);

  return (
    <main ref={ref} inert={disabled} className="w-full">
      <div className="h-full flex flex-col px-24 py-4 justify-center">{isChat && <Chat />}</div>
      <div className="bg-background fixed right-0 bottom-0 z-50 px-3 pt-2 pb-3 md:px-12 md:pb-12">
        <motion.div
          key="control-bar"
          initial={{ opacity: 0, translateY: "100%" }}
          animate={{
            opacity: sessionStarted ? 1 : 0,
            translateY: sessionStarted ? "0%" : "100%",
          }}
          transition={{ duration: 0.3, delay: sessionStarted ? 0.5 : 0, ease: "easeOut" }}
        >
          <div className="relative z-10 mx-auto w-full max-w-2xl">
            <VoiceAssistantControlBar controls={{ leave: true }} />
          </div>
        </motion.div>
      </div>
    </main>
  );
};
