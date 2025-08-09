import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AppProviders } from "@/components/providers/AppProviders";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "Jewellery CRM - Manage Your Jewellery Business",
    template: "%s | Jewellery CRM"
  },
  description: "Complete CRM solution for Indian jewellery businesses with customer management, sales pipeline, inventory tracking, and e-commerce integration.",
  keywords: [
    "jewellery CRM",
    "indian jewellery",
    "customer management",
    "sales pipeline",
    "inventory management",
    "e-commerce",
    "WhatsApp integration"
  ],
  authors: [{ name: "Jewellery CRM Team" }],
  creator: "Jewellery CRM",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://jewellerycram.com",
    title: "Jewellery CRM - Complete Business Management Solution",
    description: "Streamline your jewellery business with our comprehensive CRM system designed specifically for Indian jewellery retailers.",
    siteName: "Jewellery CRM",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jewellery CRM - Manage Your Jewellery Business",
    description: "Complete CRM solution for Indian jewellery businesses",
    creator: "@jewellerycram",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={lexend.variable}>
      <body className="font-sans antialiased">
        <AppProviders>
          {children}
        </AppProviders>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
      </body>
    </html>
  );
}
