import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { CartProvider } from "./contexts/CartContext";
import LayoutWrapper from "./components/LayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "E-Sport Connection | Монголын Mobile Legends Community",
  description:
    "Монголын Mobile Legends community. Тоглогчид, багууд, тэмцээнүүд болон шинэ боломжийн саналууд.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" }
    ],
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn" className="transition-colors duration-300">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1800942901261668"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-300 theme-transition`}
      >
        <DarkModeProvider>
          <AuthProvider>
            <SocketProvider>
              <CartProvider>
                <LayoutWrapper>{children}</LayoutWrapper>
              </CartProvider>
            </SocketProvider>
          </AuthProvider>
        </DarkModeProvider>
        <Analytics />
      </body>
    </html>
  );
}
