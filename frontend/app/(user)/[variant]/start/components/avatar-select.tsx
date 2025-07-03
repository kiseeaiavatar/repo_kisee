"use client";

import { Button } from "@/components/Button";
import Image from "next/image";
import { useState } from "react";
import { MouseEventHandler } from "react";

export default function AvatarSelect({ onDone }: { onDone?: MouseEventHandler }) {
  const [variant, setVariant] = useState(0);

  function selectAvatarVariant(variant: number) {
    setVariant(variant);
  }

  const variants = ["avatar-variant-1.svg", "avatar-variant-2.svg"];

  const options = variants.map((img: string, idx: number) => {
    return (
      <div
        key={idx}
        className={`bg-green-500 p-5 rounded-3xl cursor-pointer border-2 ${variant == idx ? "border-green-800" : "border-transparent"} hover:border-green-800`}
        onClick={() => selectAvatarVariant(idx)}
      >
        <Image src={`/${img}`} alt={`Avatar - Variant ${idx}`} width={200} height={200} />
      </div>
    );
  });

  return (
    <>
      <p className="text-green-800 font-bold text-3xl">
        Willkommen
        <br />
        Mit welchem Avatar möchtest du sprechen?
      </p>
      <div className="flex justify-evenly my-16">{options}</div>
      <Button kind="secondary" onClick={onDone}>
        Weiter
      </Button>
    </>
  );
}
