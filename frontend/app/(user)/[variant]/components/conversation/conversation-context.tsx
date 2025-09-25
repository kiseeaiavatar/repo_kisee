import { ReceivedChatMessage } from "@livekit/components-react";
import { createContext, useState } from "react";

export interface ConversationState {
  messages: ReceivedChatMessage[];
  setMessages: (messages: ReceivedChatMessage[]) => void;
}

const ConversationContext = createContext<ConversationState>({
  messages: [],
  setMessages: () => {},
});
export default ConversationContext;

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ReceivedChatMessage[]>([]);
  return (
    <ConversationContext.Provider value={{ messages, setMessages }}>
      {children}
    </ConversationContext.Provider>
  );
};
