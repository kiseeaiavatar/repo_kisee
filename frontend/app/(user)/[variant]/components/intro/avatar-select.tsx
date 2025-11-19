"use client";

import { Button } from "@/components/Button";
import { useState } from "react";

export default function AvatarSelect({ onDone }: { onDone: (idx: number) => void }) {
  const [variant, setVariant] = useState(0);

  function selectAvatarVariant(variant: number) {
    setVariant(variant);
  }

  const variants = ["avatar-variant-1.jpg", "avatar-variant-2.jpg"];

  const options = variants.map((img: string, idx: number) => {
    return (
      <div
        key={idx}
        className={`rounded-3xl cursor-pointer border-2 ${variant == idx ? "border-primary-500" : "border-primary-200"} hover:border-primary-500 overflow-hidden w-[200px] h-[200px] bg-center bg-cover`}
        style={{
          backgroundImage: `url(/${img})`,
        }}
        onClick={() => selectAvatarVariant(idx)}
      ></div>
    );
  });

  return (
    <>
      <p className="font-bold">Mit welchem Avatar möchtest du sprechen?</p>
      <div className="flex my-8 gap-8">{options}</div>
      <Button kind="primary" onClick={() => onDone(variant)}>
        Weiter
      </Button>
    </>
  );
}
