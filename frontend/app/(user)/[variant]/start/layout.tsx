import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "your wAI - Start",
};

export default function StartLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-full bg-secondary-500">
      <div className="absolute top-4 left-4">
        <Image src="/your-wai-logo-dark.svg" alt="Your wAI Logo" width={170} height={80} />
      </div>
      <div className="m-auto p-8 bg-secondary-500">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
