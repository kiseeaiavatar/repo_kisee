import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import { Box, Button, Paper, Typography } from "@mui/material";
import React, { useState } from "react";

interface SwipeEventProps {
  items: string[];
  description?: string;
  onSubmit: (results: { [key: string]: boolean }[]) => void;
}

const SwipeEvent: React.FC<SwipeEventProps> = ({ items, description, onSubmit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ [key: string]: boolean }[]>([]);

  const handleLike = () => {
    const newResults = [...results, { [items[currentIndex]]: true }];
    setResults(newResults);

    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onSubmit(newResults);
    }
  };

  const handleDislike = () => {
    const newResults = [...results, { [items[currentIndex]]: false }];
    setResults(newResults);

    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onSubmit(newResults);
    }
  };

  if (currentIndex >= items.length) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h6">Thank you for completing the swipe activity!</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", py: 2 }}>
      <Typography variant="h6" gutterBottom>
        Swipe right for activities you like, left for ones you don't
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
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h5">{items[currentIndex]}</Typography>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2 }}>
        <Button
          variant="contained"
          color="error"
          startIcon={<ThumbDownIcon />}
          onClick={handleDislike}
          size="large"
        >
          Not Interested
        </Button>
        <Button
          variant="contained"
          color="primary"
          endIcon={<ThumbUpIcon />}
          onClick={handleLike}
          size="large"
        >
          Interested
        </Button>
      </Box>
    </Box>
  );
};

export default SwipeEvent;
