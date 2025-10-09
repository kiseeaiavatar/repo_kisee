"use client";

import { Variant } from "@/lib/variants";
import { useState } from "react";
import Conversation from "./conversation/conversation";
import Intro from "./intro/intro";
import Welcome from "./welcome";

enum AppState {
  Welcome,
  Intro,
  Conversation,
}

interface AppProps {
  variant: Variant;
}

export default function App({ variant }: AppProps) {
  const [appState, setAppState] = useState<AppState>(AppState.Welcome);
  const [avatar, setAvatar] = useState<number | undefined>(undefined);
  const [subjectId, setSubjectId] = useState("");

  function handleNext(options?: { avatar?: number; subjectId: string }) {
    switch (appState) {
      case AppState.Welcome:
        setAppState(AppState.Intro);
        break;
      case AppState.Intro:
        if (options?.avatar != null) {
          setAvatar(options.avatar);
        }
        if (options?.subjectId) {
          setSubjectId(options.subjectId);
        }
        setAppState(AppState.Conversation);
        break;
      case AppState.Conversation:
        // dead end
        break;
      default:
        const _exhaustiveCheck: never = appState;
    }
  }

  function handleCancel() {
    switch (appState) {
      case AppState.Welcome:
        break;
      case AppState.Intro:
        setAppState(AppState.Welcome);
        break;
      case AppState.Conversation:
        setAppState(AppState.Intro);
        break;
      default:
        const _exhaustiveCheck: never = appState;
    }
  }

  function render() {
    switch (appState) {
      case AppState.Welcome:
        return <Welcome onDone={handleNext} />;
      case AppState.Intro:
        return <Intro onDone={handleNext} variant={variant} />;
      case AppState.Conversation:
        return (
          <Conversation
            onCancel={handleCancel}
            onDone={handleNext}
            variant={variant}
            avatar={avatar}
            subjectId={subjectId}
          />
        );

      default:
        const _exhaustiveCheck: never = appState;
    }
  }

  return render();
}
