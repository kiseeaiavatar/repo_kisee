import { ConversationChapter } from "@/lib/types";
import { ReceivedChatMessage } from "@livekit/components-react";
import { createContext, useState } from "react";

export interface ConversationState {
  messages: ReceivedChatMessage[];
  setMessages: (messages: ReceivedChatMessage[]) => void;
  chapters: ConversationChapter[];
  addChapter: (title: string) => void;
}

const ConversationContext = createContext<ConversationState>({
  messages: [],
  setMessages: () => {},
  chapters: [],
  addChapter: () => {},
});
export default ConversationContext;

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ReceivedChatMessage[]>([]);
  const [chapters, setChapters] = useState<ConversationChapter[]>([]);

  const addChapter = (title: string) => {
    setChapters((chapters) => [
      ...chapters,
      {
        title: title,
        messageId: messages[messages.length - 1]?.id,
      },
    ]);
  };
  return (
    <ConversationContext.Provider value={{ messages, setMessages, chapters, addChapter }}>
      {children}
    </ConversationContext.Provider>
  );
};
