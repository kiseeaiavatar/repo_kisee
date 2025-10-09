"use client";

import { Button } from "@/components/Button";
import { useState } from "react";

export default function TsAndCs({ onDone }: { onDone: () => void }) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [ackAI, setAckAI] = useState(false);

  return (
    <>
      <p>
        <strong>Bevor du das Gespräch startest, bestätige bitte:</strong>
      </p>
      <div className="text-left my-8 ">
        <div className="">
          <input
            type="checkbox"
            id="cb-accept-terms"
            className="border border-primary-500 bg-primary-200"
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          <label htmlFor="cb-accept-terms" className="ml-2">
            Ich bin 18 oder älter und habe die{" "}
            <a href="/terms_and_conditions" target="_blank" className="underline">
              Datenschutzrichtlinien
            </a>{" "}
            gelesen und stimme zu.
          </label>
        </div>

        <div className="mt-8">
          <input
            type="checkbox"
            id="cb-acknowledge-ai"
            className="border border-primary-500 bg-primary-200"
            onChange={(e) => setAckAI(e.target.checked)}
          />
          <label htmlFor="cb-acknowledge-ai" className="ml-2">
            Mir ist bewusst, dass ich mit einem ki-gestützten Chatbot und nicht mit einer echten
            Person kommuniziere.
          </label>
        </div>
      </div>
      <Button kind="primary" onClick={onDone} disabled={!termsAccepted || !ackAI}>
        Los geht´s zum Gespräch
      </Button>
    </>
  );
}
