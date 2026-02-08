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
  title: {
    default: 'Клинический Протокол Тарновского — Форум о бодибилдинге и фитнесе',
    template: '%s | tarnovsky.ru',
  },
  description: 'Форум сообщества Клинический Протокол Тарновского — обсуждения бодибилдинга, фитнеса, тренировок, питания и здорового образа жизни.',
  keywords: ['бодибилдинг', 'фитнес', 'тренировки', 'питание', 'форум', 'тарновский', 'протокол', 'здоровый образ жизни', 'спорт'],
  authors: [{ name: 'tarnovsky.ru' }],
  metadataBase: new URL('https://tarnovsky.ru'),
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://tarnovsky.ru',
    siteName: 'Клинический Протокол Тарновского',
    title: 'Клинический Протокол Тарновского — Форум о бодибилдинге и фитнесе',
    description: 'Форум сообщества Клинический Протокол Тарновского — обсуждения бодибилдинга, фитнеса, тренировок, питания и здорового образа жизни.',
    images: [{ url: '/images/4_logo1.png', width: 1200, height: 630, alt: 'Клинический Протокол Тарновского' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Клинический Протокол Тарновского — Форум о бодибилдинге и фитнесе',
    description: 'Форум сообщества — обсуждения бодибилдинга, фитнеса, тренировок, питания и ЗОЖ.',
    images: ['/images/4_logo1.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/images/4_logo1.png',
    apple: '/images/4_logo1.png',
  },
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
        <AuthProvider>
          <div className="App flex flex-col min-h-screen bg-white">
            <Header />

            
            <main className="flex-grow">
              <div className="min-h ">
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