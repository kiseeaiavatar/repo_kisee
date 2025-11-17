import { useRoomContext } from "@livekit/components-react";
import { LogLevel, setLogLevel } from "livekit-client";
import * as React from "react";

export const useDebugMode = ({ logLevel }: { logLevel?: LogLevel } = {}) => {
  const room = useRoomContext();

  React.useEffect(() => {
    setLogLevel(logLevel ?? "debug");

    window.__lk_room = room;

    return () => {
      window.__lk_room = undefined;
    };
  }, [room, logLevel]);
};
