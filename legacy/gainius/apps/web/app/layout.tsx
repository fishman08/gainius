import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gainius",
  description: "AI-curated workout plans, made for you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-fg min-h-screen font-body antialiased">
        {children}
      </body>
    </html>
  );
}
