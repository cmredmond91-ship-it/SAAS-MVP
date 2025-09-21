import "./globals.css";
import type { Metadata } from "next";
import GlobalHeader from "@/components/GlobalHeader";

export const metadata: Metadata = {
  title: "My App",
  description: "SaaS MVP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* ✅ Global header always at top */}
        <GlobalHeader />
        <main className="min-h-screen bg-gray-50">{children}</main>
      </body>
    </html>
  );
}






