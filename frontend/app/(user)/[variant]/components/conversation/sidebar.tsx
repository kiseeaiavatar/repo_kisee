import { Button } from "@/components/Button";
import Image from "next/image";
import ProcessOverview from "./process-overview";

interface SidebarProps {
  chapter: string;
  onCancel?: () => void;
}

export default function Sidebar({ chapter, onCancel }: SidebarProps) {
  return (
    <div className="bg-primary-400 rounded-r-3xl p-4 flex flex-col justify-between h-full">
      <div className="flex-none">
        <Image src="/your-wai-logo.svg" alt="Your wAI Logo" width={170} height={80} priority />
      </div>
      <div className="text-primary-500">
        <h4 className="font-semibold">Prozessverlauf</h4>
        <span className="font-normal">So weit bist du schon!</span>
        <ProcessOverview />
        <h4 className="font-semibold">{chapter}</h4>
      </div>
      <Button kind="primary" onClick={onCancel}>
        Abbrechen
      </Button>
    </div>
  );
}
