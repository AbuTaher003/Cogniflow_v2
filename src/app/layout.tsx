import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import "./globals.css";

const bodyFont = Manrope({ subsets: ["latin"], variable: "--font-body" });
const displayFont = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: {
    default: "CogniFlow | Academic Operating System for Students",
    template: "%s | CogniFlow"
  },
  description: "A premium student SaaS for tasks, notes, exams, habits, focus sessions, analytics, and CGPA planning.",
  keywords: ["student app", "study planner", "academic dashboard", "academic tracker", "SaaS for students", "gpa calculator", "resume builder"],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cogniflow.dev",
    title: "CogniFlow | Academic Operating System for Students",
    description: "The ultimate student operating system to track subjects, chapters, notes, habits, competitive programming, resumes, and internship applications.",
    siteName: "CogniFlow"
  },
  twitter: {
    card: "summary_large_image",
    title: "CogniFlow | Academic Operating System for Students",
    description: "The ultimate student operating system to track subjects, chapters, notes, habits, competitive programming, resumes, and internship applications."
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${displayFont.variable} bg-background text-foreground antialiased`}>
        <ThemeProvider defaultTheme="dark">
          {children}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}

