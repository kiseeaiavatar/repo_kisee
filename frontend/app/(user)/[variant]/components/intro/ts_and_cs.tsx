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
        <div className="flex flex-row">
          <input
            type="checkbox"
            id="cb-accept-terms"
            className="border border-primary-500 bg-primary-200 cursor-pointer"
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          <label htmlFor="cb-accept-terms" className="ml-2 cursor-pointer">
            Im Rahmen unseres Berufsberatungsgesprächs erfassen wir verschiedene Daten, welche für
            eine zielgerichtete Berufsberatung erforderlich sind. Diese Informationen helfen uns
            berufliche Interessen und Fähigkeiten besser zu verstehen und Ihnen passende Optionen
            anzubieten. Durch Ihre Zustimmung erklären Sie sich einverstanden mit der Verarbeitung
            Ihrer Daten für diese Zwecke gemäß unseres{" "}
            <a
              href="/KISEE-Datenschutzkonzept_HS-Offenburg.pdf"
              target="_blank"
              className="underline"
            >
              Datenschutzkonzepts
            </a>
          </label>
        </div>
        <div className="mt-8 flex flex-row">
          <input
            type="checkbox"
            id="cb-acknowledge-ai"
            className="border border-primary-500 bg-primary-200 cursor-pointer"
            onChange={(e) => setAckAI(e.target.checked)}
          />
          <label htmlFor="cb-acknowledge-ai" className="ml-2 cursor-pointer">
            Mir ist bewusst, dass ich mit einer künstlichen Intelligenz und nicht mit einer echten
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
