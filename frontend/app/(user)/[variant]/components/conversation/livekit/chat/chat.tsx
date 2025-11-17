import useAutoScroll from "@/hooks/useAutoScroll";
import useChatAndTranscription from "@/hooks/useChatAndTranscription";
import { cn } from "@/lib/utils";
import { type ReceivedChatMessage, useRemoteParticipants } from "@livekit/components-react";
import React, { useContext, useEffect } from "react";
import ConversationContext from "../../conversation-context";
import { ChatEntry } from "./chat-entry";
import { ChatInput } from "./chat-input";
import { ChatMessageView } from "./chat-message-view";

export function Chat() {
  const { messages, send } = useChatAndTranscription();
  const [isSendingMessage, setIsSendingMessage] = React.useState(false);
  const { setMessages } = useContext(ConversationContext);
  const { scrollRef, scrollToBottom } = useAutoScroll();

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

  useEffect(() => {
    setMessages(messages);
    scrollToBottom();
  }, [messages, scrollToBottom, setMessages]);

  return (
    <>
      <div ref={scrollRef} className="flex-initial mb-4 overflow-y-auto" id="myscroller">
        <ChatMessageView
          className={cn(
            "text-primary-500 mx-auto w-full transition-[opacity,translate] duration-300 ease-out",
            "translate-y-0 opacity-100 delay-200"
          )}
        >
          {messages.map((message: ReceivedChatMessage) => (
            <ChatEntry hideName hideTimestamp key={message.id} entry={message} />
          ))}
        </ChatMessageView>
      </div>
      <div className="flex-none">
        <ChatInput onSend={handleSendMessage} disabled={isInputDisabled} className="w-full" />
      </div>
    </>
  );
}
