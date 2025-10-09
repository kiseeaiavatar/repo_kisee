import "./globals.css";

export const metadata = {
  title: "your wai - Terms and Conditions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-primary-200 text-primary-500 p-16">{children}</body>
    </html>
  );
}
