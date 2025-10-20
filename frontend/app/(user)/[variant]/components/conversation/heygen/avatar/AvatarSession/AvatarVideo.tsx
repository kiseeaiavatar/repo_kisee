import React, { forwardRef } from "react";

export const AvatarVideo = forwardRef<HTMLVideoElement>(({}, ref) => {
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
      }}
    >
      <track kind="captions" />
    </video>
  );
});
AvatarVideo.displayName = "AvatarVideo";
