"use client";

import { Button } from "@/components/Button";
import { useState } from "react";

export default function SubjectId({ onDone }: { onDone: (subjectId: string) => void }) {
  const [subjectId, setSubjectId] = useState("");
  return (
    <>
      <div>
        <p>Bitte gebe deine zugewiesene ID ein.</p>
        <input
          type="text"
          placeholder="ID"
          className="w-64 bg-primary-200 border-primary-500 border rounded-xl p-2 my-8"
          onChange={(e) => setSubjectId(e.target.value)}
        />
      </div>
      <Button
        kind="primary"
        onClick={() => onDone(subjectId)}
        className="w-64"
        disabled={subjectId === ""}
      >
        Weiter
      </Button>
    </>
  );
}
