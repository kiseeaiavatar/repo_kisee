import { Typography } from "@mui/material";
import React from "react";
import { EventInput } from "../conversation";
import RatingEvent from "./rating";
import SwipeEvent from "./swipe";

interface EventContainerProps {
  eventType: string;
  eventInput: EventInput;
  onSubmit: (result: EventResult) => void;
}

export interface EventResult {
  id: string;
  results: EventItemResult[];
  created_at: string;
}

export interface EventItemResult {
  item: string;
  rating: number;
}

const EventContainer: React.FC<EventContainerProps> = ({ eventType, eventInput, onSubmit }) => {
  const handleSwipeSubmit = (results: EventItemResult[]) => {
    onSubmit({
      id: crypto.randomUUID(),
      results,
      created_at: new Date().toISOString(),
    });
  };

  const handleRatingSubmit = (results: EventItemResult[]) => {
    onSubmit({
      id: crypto.randomUUID(),
      results,
      created_at: new Date().toISOString(),
    });
  };

  return (
    <div className="widget-container px-3 py-4 text-center flex flex-col h-full">
      {eventInput.chapter_id && (
        <h1 className="event-heading text-2xl font-bold mb-4">{eventInput.chapter_id}</h1>
      )}
      {eventInput.description && (
        <p className="event-desc text-xl mb-8">{eventInput.description}</p>
      )}

      {eventType === "swipe" && eventInput.items && (
        <SwipeEvent items={eventInput.items} onSubmit={handleSwipeSubmit} />
      )}

      {eventType === "rating" && eventInput.items && (
        <RatingEvent items={eventInput.items} onSubmit={handleRatingSubmit} />
      )}

      {!eventType ||
        (!eventInput.items && (
          <Typography variant="body1" color="error">
            Invalid event type or missing input data
          </Typography>
        ))}
    </div>
  );
};

export default EventContainer;
