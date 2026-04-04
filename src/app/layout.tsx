import type { Metadata } from "next";
import { Lora, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AuthProvider from "@/components/AuthProvider";
import AuthGuard from "@/components/AuthGuard";

const lora = Lora({ 
  subsets: ["latin"], 
  variable: "--font-lora",
  display: 'swap',
});

const dmSans = DM_Sans({ 
  subsets: ["latin"], 
  variable: "--font-dm-sans",
  display: 'swap',
});

const mono = JetBrains_Mono({ 
  subsets: ["latin"], 
  variable: "--font-mono",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "FlowMind - AI Second Brain",
  description: "AI-powered second brain for students and developers",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${lora.variable} ${dmSans.variable} ${mono.variable} font-sans antialiased bg-[#F5F0EA] text-[#2C2420] flex min-h-screen`}>
        <AuthProvider>
          <AuthGuard>
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
