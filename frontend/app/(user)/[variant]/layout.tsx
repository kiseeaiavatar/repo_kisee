import { ALL_VARIANTS } from "@/lib/variants";
import "@livekit/components-styles";
import { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "../globals.css";

const font = DM_Sans({
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "your wAI",
};

// serve only /chat/... and /voice/... paths
export const dynamicParams = false;
export async function generateStaticParams() {
  return ALL_VARIANTS.map((variant) => ({
    variant,
  }));
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${font.className}`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
