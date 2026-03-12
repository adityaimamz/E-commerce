import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import Script from "next/script";

export const metadata: Metadata = {
  title: "E-Commerce",
  description: "E-Commerce Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const midtransClientKey = process.env.MIDTRANS_CLIENT_KEY || "";
  const midtransEnv = process.env.MIDTRANS_IS_PRODUCTION === "true" ? "" : ".sandbox";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Script
          src={`https://app${midtransEnv}.midtrans.com/snap/snap.js`}
          data-client-key={midtransClientKey}
          strategy="beforeInteractive"
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
