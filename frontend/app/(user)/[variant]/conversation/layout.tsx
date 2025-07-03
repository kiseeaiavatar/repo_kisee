import { Button } from "@/components/Button";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "your wAI - Beratungsgespräch",
};

export default function StartLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-full bg-primary-100">
      <div className="sidebar bg-primary-400 flex-initial rounded-r-3xl p-4 flex flex-col justify-between">
        <div className="flex-none">
          <Image src="/your-wai-logo.svg" alt="Your wAI Logo" width={170} height={80} />
        </div>
        <div className="text-primary-500">
          <h4 className="font-semibold">Prozessverlauf</h4>
          <span className="font-normal">So weit bist du schon!</span>
          <span className="font-normal">...</span>
        </div>
        <Button kind="primary">Abbrechen</Button>
      </div>
      <div className="center flex flex-1 justify-center">
        <Image className="m-auto" src="/avatar-1.png" alt="Avatar 1" width={256} height={256} />
      </div>
      <div className="widget shadow-[-4px_4px_16px_rgba(0,0,0,0.15)] bg-primary-200 text-primary-500 flex-1 rounded-l-3xl p-4">
        Widget
      </div>
    </div>
  );
}
