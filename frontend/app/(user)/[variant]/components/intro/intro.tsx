"use client";

import { Button } from "@/components/Button";
import { Variant } from "@/lib/variants";
import Image from "next/image";
import { useState } from "react";
import AvatarSelect from "./avatar-select";

enum StartState {
  Avatar,
  Start,
  Done,
}

interface IntroProps {
  onDone?: ({ avatar }: { avatar: number | null }) => void;
  variant: Variant;
}

export default function Intro({ onDone, variant }: IntroProps) {
  const [myState, setMyState] = useState(
    variant == "avatar" ? StartState.Avatar : StartState.Start
  );
  const [avatar, setAvatar] = useState<number | null>(null);

  function next() {
    switch (myState) {
      case StartState.Avatar:
        setMyState(StartState.Start);
        break;
      case StartState.Start:
        setMyState(StartState.Done);
        onDone?.({ avatar });
        break;
      case StartState.Done:
        // dead end
        break;
      default:
        const _exhaustiveCheck: never = myState;
    }
  }

  function onAvatarSelect(avatarIdx: number) {
    setAvatar(avatarIdx);
    next();
  }

  function render() {
    switch (myState) {
      case StartState.Avatar:
        return <AvatarSelect onDone={onAvatarSelect} />;
      case StartState.Start:
        return <Confirm onDone={next} />;
      case StartState.Done:
        // dead end
        return;
      default:
        const _exhaustiveCheck: never = myState;
    }
  }

  return (
    <div className="flex h-full bg-secondary-500">
      <div className="absolute top-4 left-4">
        <Image
          src="/your-wai-logo-dark.svg"
          alt="Your wAI Logo"
          width={170}
          height={80}
          style={{ width: "170px", height: "80px" }}
        />
      </div>
      <div className="m-auto p-8 text-center">
        <div className="p-8">{render()}</div>
      </div>
    </div>
  );
}

function Confirm({ onDone }: { onDone: () => void }) {
  return (
    <Button kind="secondary" onClick={onDone}>
      Beratung starten
    </Button>
  );
}
