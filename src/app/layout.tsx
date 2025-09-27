import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IronFlex Forum",
  description: "Next.js + MongoDB Forum Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google AdSense Script */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9876848164575099"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        
        <AuthProvider>
          <div className="App flex flex-col min-h-screen bg-white">
            <Header />
            
            <main className="flex-grow">
              <div className="min-h-[calc(100vh-230px)]">
                {children}
              </div>
            </main>
            
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
