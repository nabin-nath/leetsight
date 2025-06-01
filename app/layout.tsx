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
  title: "Leetsight - Interview Insights",
  description: "Explore recent tech interview questions and insights.",
};

const layout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <Head>
        <title>
          Leetsight - AI-Powered Interview Prep from Real LeetCode Discussions
        </title>
        <meta
          property="description"
          content="LeetSight helps software engineers prepare for technical interviews by analyzing real LeetCode discussion posts, identifying trends, and surfacing relevant coding questions by company and role."
          key="description"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.leetsight.com/" />
        <meta
          property="og:title"
          content="LeetSight – AI-Powered Interview Prep from Real LeetCode Discussions"
        />
        <meta
          property="og:description"
          content="Discover trending interview questions, role-specific patterns, and LeetCode problem mappings – all powered by real user-shared experiences and AI."
        />
        <meta
          property="og:image"
          content="https://vpptjdtojpuhmytedqil.supabase.co/storage/v1/object/public/leetsight-assets//leetsight.png"
        />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://www.leetsight.com/" />
        <meta
          property="twitter:title"
          content="LeetSight – AI-Powered Interview Prep from Real LeetCode Discussions"
        />
        <meta
          property="twitter:description"
          content="LeetSight analyzes LeetCode Discuss posts to reveal real interview questions, trends, and related coding problems for efficient tech interview prep."
        />
        <meta
          property="twitter:image"
          content="https://vpptjdtojpuhmytedqil.supabase.co/storage/v1/object/public/leetsight-assets//leetsight.png"
        />
      </Head>
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
