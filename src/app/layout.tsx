import type { Metadata } from "next";
import { Inter, Red_Hat_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "./providers/ReduxProvider";
import ServiceContextProvider from "./providers/ServiceContextProvider";

const interSans = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
});

const redhatMono = Red_Hat_Mono({
  variable: "--font-redhat-mono",
  subsets: ["latin"],
});

const APP_NAME = "Target Dice Demo";
const APP_DEFAULT_TITLE = "Target Dice Demo";
const APP_TITLE_TEMPLATE = "%s - Target Dice Demo";
const APP_DESCRIPTION = "Dice roll simulation with pre-configurable outcomes.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${interSans.variable} ${redhatMono.variable} antialiased`}
      >
        <ReduxProvider>
          <ServiceContextProvider>{children}</ServiceContextProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
