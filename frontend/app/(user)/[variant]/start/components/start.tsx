"use client";

import { Button } from "@/components/Button";
import { Variant } from "@/lib/variants";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AvatarSelect from "./avatar-select";

enum StartState {
  Avatar,
  Start,
  Done,
}

export default function Start({ variant }: { variant: Variant }) {
  const [myState, setMyState] = useState(StartState.Avatar);

  function next() {
    switch (myState) {
      case StartState.Avatar:
        setMyState(StartState.Start);
        break;
      case StartState.Start:
        setMyState(StartState.Done);
        break;
      case StartState.Done:
        // dead end
        break;
      default:
        const _exhaustiveCheck: never = myState;
    }
  }

  function render() {
    console.log("render", myState);
    switch (myState) {
      case StartState.Avatar:
        return <AvatarSelect onDone={next} />;
      case StartState.Start:
        return <Confirm variant={variant} />;
      case StartState.Done:
        // dead end
        return;
      default:
        const _exhaustiveCheck: never = myState;
    }
  }

  return (
    <div className="m-auto p-8 bg-secondary-500">
      <div className="p-8 text-center">{render()}</div>
    </div>
  );
}

function Confirm({ variant }: { variant: Variant }) {
  return (
    <Button kind="secondary" href={`/${variant}/conversation`}>
      Beratung starten
    </Button>
  );
}
