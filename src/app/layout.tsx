import type { Metadata } from "next";
import "./globals.css";
import { FirebaseInit } from "./components/FirebaseInit";
import { ThemeInjector, themeToCssVars } from "@/ui";

const themeCss = `:root { ${Object.entries(themeToCssVars())
  .map(([k, v]) => `${k}: ${v}`)
  .join("; ")} }`;

export const metadata: Metadata = {
  title: "TableFlow — Smart Waitlist & Floor Management",
  description: "Visual floor map and waitlist dashboard for restaurants. Seat smarter, serve faster."
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
        {children}
      </body>
    </html>
  );
}

