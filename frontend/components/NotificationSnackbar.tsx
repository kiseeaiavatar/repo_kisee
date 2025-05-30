import CloseIcon from "@mui/icons-material/Close";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import * as React from "react";

interface NotificationSnackbarProps {
  open: boolean;
  message: string;
  onClose: (event: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => void;
  onConfirm: () => void;
}

export default function NotificationSnackbar({
  open,
  message,
  onClose,
  onConfirm,
}: NotificationSnackbarProps) {
  const action = (
    <React.Fragment>
      <Button color="secondary" size="small" onClick={onConfirm}>
        OK
      </Button>
      <IconButton size="small" aria-label="close" color="inherit" onClick={onClose}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </React.Fragment>
  );

  return (
    <Snackbar
      open={open}
      onClose={onClose}
      message={message}
      action={action}
      // Remove autoHideDuration to keep the snackbar open until user interaction
    />
  );
}
