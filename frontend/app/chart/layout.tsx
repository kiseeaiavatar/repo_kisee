import { Metadata } from "next";
import { DM_Sans } from "next/font/google";

const font = DM_Sans({
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "chart test",
};

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
