"use client";

import { Button } from "@/components/Button";
import Image from "next/image";

interface WelcomeProps {
  onDone?: () => void;
}

export default function Welcome({ onDone }: WelcomeProps) {
  return (
    <div
      className="h-full flex bg-cover justify-center items-end"
      style={{
        backgroundImage: "url(/splash.webp)",
      }}
    >
      <div className="text-center">
        <Image
          src="/your-wai-logo-secondary.svg"
          alt="Your wAI Logo"
          width={350}
          height={158}
          style={{ width: "350px", height: "158px" }}
          priority
        />
        <p className="text-secondary-500 my-8 text-2xl">
          Your potential, your path.
          <br />
          With AI at your side.
        </p>
        <Button kind="secondary" onClick={onDone} className="w-full mb-16">
          Let&apos;s go!
        </Button>
      </div>
    </div>
  );
}
