import { Button } from "@/components/Button";
import {
  ConversationChapter,
  EventInput,
  EventItemResult,
  MyceliaConversation,
  MyceliaConversationItem,
  MyceliaEvaluationRequestBody,
  MyceliaEvaluationResponseBody,
  MyceliaGames,
} from "@/lib/types";
import { ReceivedChatMessage, useRoomContext } from "@livekit/components-react";
import { Room } from "livekit-client";
import React, { useContext, useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { BarLoader } from "react-spinners";
import ConversationContext from "../conversation-context";

interface EvaluationEventProps {
  data: EventInput;
  onSubmit: (results: EventItemResult[]) => void;
}

const EvaluationEvent: React.FC<EvaluationEventProps> = ({ data, onSubmit }) => {
  const { messages, chapters } = useContext(ConversationContext);
  const room = useRoomContext();

  const [evaluationUrls, setEvaluationUrls] = useState<MyceliaEvaluationResponseBody | null>(null);
  const alreadySentRef = useRef(false);

  // send data and transcriptions to backend
  const myceliaConversation = messagesToMyceliaConversation(messages, chapters, room);
  const myceliaGames = preferencesToMyceliaGames(data.userdata!.preferences);

  useEffect(() => {
    if (alreadySentRef.current) return;
    alreadySentRef.current = true;

    const url = new URL("/api/evaluation", window.location.origin);
    const body: MyceliaEvaluationRequestBody = {
      conversation: myceliaConversation,
      games: myceliaGames,
      userinfo: data.userdata!.userinfo,
    };

    fetch(url.toString(), {
      method: "POST",
      body: JSON.stringify({
        ...body,
        userinfo: {
          ...body.userinfo,
          start_time: new Date(Math.floor(body.userinfo.start_time)).toISOString(),
          end_time: new Date().toISOString(),
        },
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((data: MyceliaEvaluationResponseBody) => {
        setEvaluationUrls(data);
      })
      .catch((error) => {
        console.error("Error generating evaluation:", error);
      });
  }, [myceliaConversation, myceliaGames, data.userdata]);

  return (
    <div className="flex flex-col flex-1">
      {!evaluationUrls && (
        <>
          <p className="mb-4">
            Wir erstellen gerade deine persönliche Gesprächsauswertung. Gedulde dich einen Moment.
          </p>
          <div className="mx-auto">
            <BarLoader color="#3E0BB6" height={8} />
          </div>
        </>
      )}
      {evaluationUrls && (
        <>
          <p className="mb-4">
            Hier geht es zu deiner persönlichen Gesprächsauswertung. Scanne einfach den QR Code oder
            klicke den Link darunter.
          </p>
          <div className="w-3/4 mx-auto">
            <QRCode
              size={256}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              value={evaluationUrls.mobileUrl}
              viewBox={`0 0 256 256`}
            />
          </div>
          <a href={evaluationUrls.desktopUrl} target="_blank">
            Auswertung ansehen
          </a>
        </>
      )}
      <Button kind="primary" className="mt-auto mx-auto" onClick={() => onSubmit([])}>
        Abschließen
      </Button>
    </div>
  );
};

export default EvaluationEvent;

function messagesToMyceliaConversation(
  messages: ReceivedChatMessage[],
  chapters: ConversationChapter[],
  room: Room
): MyceliaConversation {
  // Group chapters by the messageId they should appear before
  const byMessage = chapters.reduce((map: Record<string, ConversationChapter[]>, chapter) => {
    (map[chapter.messageId || "first"] ||= []).push(chapter);
    return map;
  }, {});

  const merged: MyceliaConversation = [];

  if (byMessage["first"])
    merged.push(
      ...byMessage["first"].map(
        (chapter) =>
          ({
            role: "chapter",
            content: chapter.title,
          }) as MyceliaConversationItem
      )
    );

  for (const message of messages) {
    // Insert the message itself
    merged.push({
      role: message.from?.identity === room.localParticipant.identity ? "user" : "agent",
      timestamp: message.timestamp,
      content: message.message,
    });

    // Insert chapters that belong after this message
    if (byMessage[message.id]) {
      merged.push(
        ...byMessage[message.id].map(
          (chapter) =>
            ({
              role: "chapter",
              content: chapter.title,
            }) as MyceliaConversationItem
        )
      );
    }
  }

  return merged;
}

function preferencesToMyceliaGames(preferences: {
  [key: string]: EventItemResult[];
}): MyceliaGames {
  return Object.entries(preferences).map(([key, resultItems]) => ({
    name: key,
    items: resultItems,
  }));
}
