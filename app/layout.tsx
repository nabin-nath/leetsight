import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "../components/theme-provider";
import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Analytics } from "@vercel/analytics/next";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Leetsight - AI-Powered Interview Preperation",
  description:
    "LeetSight helps software engineers prepare for technical interviews by analyzing real LeetCode discussion posts, identifying trends, and surfacing relevant coding questions by company and role.",
  openGraph: {
    title:
      "LeetSight – AI-Powered Interview Prep from Real LeetCode Discussions",
    description:
      "Discover trending interview questions, role-specific patterns, and LeetCode problem mappings – all powered by real user-shared experiences and AI.",
    url: "https://www.leetsight.com/",
    type: "website",
    images: [
      {
        url: "https://vpptjdtojpuhmytedqil.supabase.co/storage/v1/object/public/leetsight-assets//leetsight.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "LeetSight – AI-Powered Interview Prep from Real LeetCode Discussions",
    description:
      "LeetSight analyzes LeetCode Discuss posts to reveal real interview questions, trends, and related coding problems for efficient tech interview prep.",
    images: [
      "https://vpptjdtojpuhmytedqil.supabase.co/storage/v1/object/public/leetsight-assets//leetsight.png",
    ],
  },
};

const layout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>
              <AppSidebar variant="inset" />
              <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                  {children}
                  <Toaster />
                  <Analytics />
                  <SpeedInsights />
                </div>
              </SidebarInset>
            </SidebarProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
};

export default layout;
