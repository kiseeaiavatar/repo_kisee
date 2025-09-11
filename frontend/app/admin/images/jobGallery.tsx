"use client";

import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import Image from "next/image";
import * as React from "react";

interface JobGalleryProps {
  images: string[];
}

export default function JobGallery({ images }: JobGalleryProps) {
  const [open, setOpen] = React.useState(false);
  const [toast, setToast] = React.useState("");

  const showToast = (message: string) => {
    setToast(message);
    setOpen(true);
  };

  const closeToast = (event: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  const action = (
    <React.Fragment>
      <IconButton size="small" aria-label="close" color="inherit" onClick={closeToast}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </React.Fragment>
  );

  return (
    <>
      <div className="grid grid-cols-5 gap-4 auto-rows-[200px]">
        {images.map((img, i) => {
          return (
            <div className="overflow-hidden relative cursor-pointer" key={i}>
              <Image
                src={img}
                alt={img}
                fill={true}
                className="object-contain"
                onClick={() => {
                  const imgTag = `[${img}]`;
                  navigator.clipboard.writeText(imgTag);
                  showToast(`Copied "${imgTag}" to clipboard`);
                }}
              />
            </div>
          );
        })}
      </div>
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={closeToast}
        message={toast}
        action={action}
      />
    </>
  );
}
