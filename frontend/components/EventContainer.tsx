import { Box, Typography } from "@mui/material";
import React from "react";
import RatingEvent from "./RatingEvent";
import SwipeEvent from "./SwipeEvent";

interface EventContainerProps {
  eventType: string;
  eventInput: any;
  onSubmit: (results: any) => void;
}

const EventContainer: React.FC<EventContainerProps> = ({ eventType, eventInput, onSubmit }) => {
  const handleSwipeSubmit = (results: { [key: string]: boolean }[]) => {
    onSubmit({
      id: crypto.randomUUID(),
      results,
      created_at: new Date().toISOString(),
    });
  };

  const handleRatingSubmit = (results: { [key: string]: number }[]) => {
    onSubmit({
      id: crypto.randomUUID(),
      results,
      created_at: new Date().toISOString(),
    });
  };

  return (
    <Box sx={{ width: "100%", my: 2 }}>
      {eventInput.description && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          {eventInput.description}
        </Typography>
      )}

      {eventType === "swipe" && eventInput.items && (
        <SwipeEvent
          items={eventInput.items}
          description={eventInput.description}
          onSubmit={handleSwipeSubmit}
        />
      )}

      {eventType === "rating" && eventInput.items && (
        <RatingEvent
          items={eventInput.items}
          description={eventInput.description}
          onSubmit={handleRatingSubmit}
        />
      )}

      {!eventType ||
        (!eventInput.items && (
          <Typography variant="body1" color="error">
            Invalid event type or missing input data
          </Typography>
        ))}
    </Box>
  );
};

export default EventContainer;
