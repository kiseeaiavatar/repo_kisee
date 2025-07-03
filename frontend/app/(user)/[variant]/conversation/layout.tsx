import { Button } from "@/components/Button";
import { Metadata } from "next";
import Image from "next/image";
import Sidebar from "./components/sidebar";

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
      <div className="flex-initial">
        <Sidebar />
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
