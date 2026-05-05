import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workout",
  description: "AI-curated workout plans, made for you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
