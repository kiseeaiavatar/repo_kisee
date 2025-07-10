import { Metadata } from "next";
import Sidebar from "./components/sidebar";

export const metadata: Metadata = {
  title: "your wAI - Beratungsgespräch",
};

export default function ConversationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-full bg-primary-100">
      <div className="flex-initial">
        <Sidebar />
      </div>
      <div className="center flex flex-1 justify-center">{children}</div>
      <div className="widget hidden shadow-[-4px_4px_16px_rgba(0,0,0,0.15)] bg-primary-200 text-primary-500 flex-1 rounded-l-3xl p-4">
        Widget
      </div>
    </div>
  );
}
