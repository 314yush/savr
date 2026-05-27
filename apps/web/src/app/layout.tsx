import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Savr — Goal-Based Savings",
  description: "Save for what matters. Earn real yield on Base.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#171719",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-[#171719] text-white">
        <Providers>
          <div className="mx-auto min-h-screen w-full max-w-[430px]">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
