import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import Script from 'next/script';
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Team Management App",
  description: "A comprehensive team management application with tasks, chat, and resources",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
        
        {/* SoundCloud Widget API */}
        <Script
          id="soundcloud-api"
          src="https://w.soundcloud.com/player/api.js"
          strategy="beforeInteractive"
        />
        
        {/* Script to initialize SoundCloud when loaded */}
        <Script id="soundcloud-init">
          {`
            if (typeof window !== 'undefined' && window.setupSoundCloudReady) {
              console.log('SoundCloud API loaded via Next.js Script');
              window.setupSoundCloudReady();
            }
          `}
        </Script>
        
        {/* YouTube IFrame API */}
        <Script
          id="youtube-api"
          src="https://www.youtube.com/iframe_api"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
} 