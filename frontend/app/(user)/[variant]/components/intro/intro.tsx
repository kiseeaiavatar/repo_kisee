"use client";

import { Variant } from "@/lib/variants";
import Image from "next/image";
import { useState } from "react";
import AvatarSelect from "./avatar-select";
import Explanation from "./explanation";
import SubjectId from "./subjectId";
import TsAndCs from "./ts_and_cs";

enum StartState {
  SubjectId,
  Explanation,
  Avatar,
  TsAndCs,
  Done,
}

interface IntroProps {
  onDone?: ({ avatar, subjectId }: { avatar?: number; subjectId: string }) => void;
}

export default function Intro({ onDone }: IntroProps) {
  const [myState, setMyState] = useState(StartState.SubjectId);
  // last-minute-change: always use avatar 1 (male)
  const [avatar, setAvatar] = useState<number>(1);
  const [subjectId, setSubjectId] = useState("");

  function next() {
    switch (myState) {
      case StartState.SubjectId:
        setMyState(StartState.Explanation);
        break;
      case StartState.Explanation:
        // if (variant === "avatar") {
        //   setMyState(StartState.Avatar);
        // } else {
        //   setMyState(StartState.TsAndCs);
        // }
        // last-minute-change: no avatar select
        setMyState(StartState.TsAndCs);
        break;
      case StartState.Avatar:
        setMyState(StartState.TsAndCs);
        break;
      case StartState.TsAndCs:
        setMyState(StartState.Done);
        onDone?.({ avatar, subjectId });
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
      case StartState.SubjectId:
        return (
          <SubjectId
            onDone={(subjectId) => {
              setSubjectId(subjectId);
              next();
            }}
          />
        );
      case StartState.Explanation:
        return <Explanation onDone={next} />;
      case StartState.Avatar:
        return <AvatarSelect onDone={onAvatarSelect} />;
      case StartState.TsAndCs:
        return <TsAndCs onDone={next} />;
      case StartState.Done:
        // dead end
        return;
      default:
        const _exhaustiveCheck: never = myState;
    }
  }

  return (
    <div className="flex h-full bg-primary-200 justify-center items-center">
      <div className="flex flex-col items-center w-full max-w-[50%]">
        <Image
          src="/your-wai-logo-primary.svg"
          alt="Your wAI Logo"
          width={170}
          height={80}
          style={{ width: "170px", height: "80px" }}
        />
        <div className="p-8 text-center text-primary-500">{render()}</div>
      </div>
    </div>
  );
}
