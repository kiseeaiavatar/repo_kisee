import { EventInput, EventItemResult, EventResult, EventType } from "@/lib/types";
import React from "react";
import EvaluationEvent from "./evaluation";
import LifelineEvent from "./lifeline";
import RatingEvent from "./rating";
import SwipeEvent from "./swipe";
import Swipe2Event from "./swipe2";

interface EventContainerProps {
  eventType: EventType;
  eventInput: EventInput;
  onSubmit: (result: EventResult) => void;
}

const getEvent = (
  eventType: EventType,
  eventInput: EventInput,
  onSubmit: (results: EventItemResult[]) => void
) => {
  switch (eventType) {
    case "swipe":
      if (!eventInput.items) return <p className="text-red">Missing input data</p>;
      return <SwipeEvent items={eventInput.items} onSubmit={onSubmit} />;
    case "swipe2":
      if (!eventInput.items) return <p className="text-red">Missing input data</p>;
      return <Swipe2Event items={eventInput.items} onSubmit={onSubmit} />;
    case "rating":
      if (!eventInput.items) return <p className="text-red">Missing input data</p>;
      return <RatingEvent items={eventInput.items} onSubmit={onSubmit} />;
    case "lifeline":
      return <LifelineEvent onSubmit={onSubmit} />;
    case "evaluation":
      return <EvaluationEvent data={eventInput} onSubmit={onSubmit} />;
    case "chapter":
    case "none":
      return <p className="text-orange">Unexpected event type</p>;
    default:
      const _exhaustiveCheck: never = eventType;
      return <p className="text-red">Unknown event type</p>;
  }
};

const EventContainer: React.FC<EventContainerProps> = ({ eventType, eventInput, onSubmit }) => {
  const handleEventSubmit = (results: EventItemResult[]) => {
    onSubmit({
      id: crypto.randomUUID(),
      results,
      created_at: new Date().toISOString(),
    });
  };

  return (
    <div className="px-3 py-4 text-center flex flex-col justify-center w-full">
      {eventInput.chapter_id && (
        <h1 className="event-heading text-2xl font-bold mb-4">{eventInput.chapter_id}</h1>
      )}
      {eventInput.description && (
        <p className="event-desc text-xl mb-8">{eventInput.description}</p>
      )}
      {getEvent(eventType, eventInput, handleEventSubmit)}
    </div>
  );
};

export default EventContainer;
