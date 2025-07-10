import { ChatEntry } from "@/components/livekit/chat/chat-entry";
import { ChatInput } from "@/components/livekit/chat/chat-input";
import { ChatMessageView } from "@/components/livekit/chat/chat-message-view";
import useChatAndTranscription from "@/hooks/useChatAndTranscription";
import { cn } from "@/lib/utils";
import { type ReceivedChatMessage, useRemoteParticipants } from "@livekit/components-react";
import React from "react";

export function Chat() {
  const { messages, send } = useChatAndTranscription();
  const [isSendingMessage, setIsSendingMessage] = React.useState(false);

  const participants = useRemoteParticipants();
  const isAgentAvailable2 = participants.some((p) => p.isAgent);
  const isInputDisabled = !isAgentAvailable2 || isSendingMessage;

  const handleSendMessage = async (message: string) => {
    setIsSendingMessage(true);
    try {
      await send(message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <>
      <div className="flex-initial mb-4 overflow-y-scroll">
        <ChatMessageView
          className={cn(
            "text-primary-500 mx-auto w-full transition-[opacity,translate] duration-300 ease-out",
            "translate-y-0 opacity-100 delay-200"
          )}
        >
          <div id="scroller" className="space-y-3 whitespace-pre-wrap chat-message-list">
            {messages.map((message: ReceivedChatMessage) => (
              <ChatEntry hideName hideTimestamp key={message.id} entry={message} />
            ))}
            <div id="anchor" className="chat-scroll-anchor" />
          </div>
        </ChatMessageView>
      </div>
      <div className="flex-none">
        <ChatInput onSend={handleSendMessage} disabled={isInputDisabled} className="w-full" />
      </div>
    </>
  );
}
