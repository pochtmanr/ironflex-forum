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
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9876848164575099"
          crossOrigin="anonymous"></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <div className="App flex flex-col min-h-screen bg-white">
            <Header />
            
            {/* Main Ad Unit - After Navbar, Before Forum */}
            <div className="w-full bg-gray-50 py-2">
              <div className="max-w-7xl mx-auto px-4 flex justify-center">
                <ins className="adsbygoogle"
                     style={{display:'block'}}
                     data-ad-client="ca-pub-9876848164575099"
                     data-ad-slot="7737923860"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
              </div>
            </div>
            
            <main className="flex-grow">
              <div className="min-h-[calc(100vh-230px)]">
                {children}
              </div>
            </main>
            
            <Footer />
          </div>
        </AuthProvider>
        
        {/* Initialize AdSense */}
        <Script id="adsbygoogle-init" strategy="afterInteractive">
          {`
            (adsbygoogle = window.adsbygoogle || []).push({});
          `}
        </Script>
      </body>
    </html>
  );
}