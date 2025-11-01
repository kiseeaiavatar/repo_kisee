"use client";

import { Button } from "@/components/Button";
import { useState } from "react";

export default function Explanation({ onDone }: { onDone: () => void }) {
  const [cnt, setCnt] = useState(0);

  function onNext() {
    if (cnt == 2) {
      return onDone();
    }
    setCnt(cnt + 1);
  }

  return (
    <>
      <div className="p-8">
        {cnt === 0 && (
          <p>
            <strong>Du fragst dich, welcher Beruf zu dir passt?</strong>
            <br />
            <br />
            <strong>your wai</strong> ist dein Wegweiser für{" "}
            <strong>deine berufliche Orientierung</strong>.
          </p>
        )}
        {cnt === 1 && (
          <p>
            Das folgende Gespräch wird ungefähr <strong>60 Minuten</strong> dauern.
            <br />
            <br /> Du brauchst <strong>kein Vorwissen</strong>.<br /> Es geht um dich,{" "}
            <strong>deine Interessen</strong> und <strong>deine Persönlichkeit</strong>.
          </p>
        )}
        {cnt === 2 && (
          <p>
            <strong>Kurze Gesprächshinweise</strong>
            <br />
            <br /> Hier folgen Hinweise zum Chatbot
          </p>
        )}
      </div>
      <Button kind="primary" onClick={onNext} className="w-64">
        Weiter
      </Button>
    </>
  );
}
