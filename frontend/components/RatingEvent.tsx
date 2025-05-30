import { Box, Button, Paper, Slider, Typography } from "@mui/material";
import React, { useState } from "react";

interface RatingEventProps {
  items: string[];
  description?: string;
  onSubmit: (results: { [key: string]: number }[]) => void;
}

const RatingEvent: React.FC<RatingEventProps> = ({ items, description, onSubmit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ [key: string]: number }[]>([]);
  const [currentRating, setCurrentRating] = useState(5);

  const handleRatingChange = (_event: Event, newValue: number | number[]) => {
    setCurrentRating(newValue as number);
  };

  const handleNext = () => {
    const newResults = [...results, { [items[currentIndex]]: currentRating }];
    setResults(newResults);

    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentRating(5); // Reset rating for next item
    } else {
      onSubmit(newResults);
    }
  };

  if (currentIndex >= items.length) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h6">Thank you for completing the rating activity!</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", py: 2 }}>
      <Typography variant="h6" gutterBottom>
        Rate how much you enjoy each activity (1-10)
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {description}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {currentIndex + 1} of {items.length}
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          my: 2,
          borderRadius: 2,
          backgroundColor: "background.paper",
          minHeight: "150px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h5" gutterBottom>
          {items[currentIndex]}
        </Typography>

        <Box sx={{ width: "100%", px: 2, mt: 2 }}>
          <Slider
            value={currentRating}
            onChange={handleRatingChange}
            aria-labelledby="rating-slider"
            valueLabelDisplay="auto"
            step={1}
            marks
            min={1}
            max={10}
          />
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
            <Typography variant="body2">1</Typography>
            <Typography variant="body2">10</Typography>
          </Box>
        </Box>

        <Typography variant="h6" sx={{ mt: 2 }}>
          Rating: {currentRating}
        </Typography>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Button variant="contained" color="primary" onClick={handleNext} size="large">
          {currentIndex < items.length - 1 ? "Next" : "Submit"}
        </Button>
      </Box>
    </Box>
  );
};

export default RatingEvent;
