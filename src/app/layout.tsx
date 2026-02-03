import type { Metadata } from "next";
import "./globals.css";
import { FirebaseInit } from "./components/FirebaseInit";
import { ThemeInjector, themeToCssVars } from "@/ui";

const themeCss = `:root { ${Object.entries(themeToCssVars())
  .map(([k, v]) => `${k}: ${v}`)
  .join("; ")} }`;

export const metadata: Metadata = {
  title: "Gilabun — Waitlist & Tables",
  description: "Restaurant hostess dashboard"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased" style={{ fontFamily: "var(--font)" }}>
        <ThemeInjector />
        <FirebaseInit />
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-3 py-4 sm:px-4 sm:py-6">
          {children}
        </div>
      </body>
    </html>
  );
}

