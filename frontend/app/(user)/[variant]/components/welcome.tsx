"use client";

import Image from "next/image";

interface WelcomeProps {
  onDone?: () => void;
}

export default function Welcome({ onDone }: WelcomeProps) {
  return (
    <div className="h-full bg-secondary-500 flex justify-center">
      <div className="m-auto p-8 cursor-pointer" onClick={onDone}>
        <p className="text-center text-white mb-16 text-2xl">
          Willkommen
          <br />
          bei
        </p>
        <Image
          src="/your-wai-logo.svg"
          alt="Your wAI Logo"
          width={620}
          height={280}
          style={{ width: "620px", height: "280px" }}
          priority
        />
      </div>
    </div>
  );
}
