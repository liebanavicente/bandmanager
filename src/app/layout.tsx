import type { Metadata } from "next";
import { Anton, Geist_Mono, Instrument_Serif, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/* Tipografía de cartel de concierto: titulares condensados en caja alta */
const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

/* Serif editorial en cursiva: la "voz" de la banda (saludos, lugares, citas) */
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BandManager",
    template: "%s · BandManager",
  },
  description: "Gestión integral para bandas: eventos, repertorio, merch y más.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${anton.variable} ${instrumentSerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
