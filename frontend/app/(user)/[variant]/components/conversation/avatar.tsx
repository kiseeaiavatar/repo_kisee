import { VoiceAssistantControlBar } from "@livekit/components-react";
import Image from "next/image";

export default function Avatar() {
  return (
    <>
      <div className="flex flex-auto">
        <Image
          className="m-auto"
          src="/avatar-1.png"
          alt="avatar-1"
          width={512}
          height={512}
          style={{ width: "512px", height: "512px" }}
          priority
        />
      </div>

      <VoiceAssistantControlBar controls={{ leave: false }} />
    </>
  );
}
