"use client";

import {
  HelpCircleIcon,
  LayoutDashboardIcon,
  MicroscopeIcon,
  ScrollText,
} from "lucide-react";
import * as React from "react";

import { NavMain } from "@/components/ui/NavMain";
import { NavSecondary } from "@/components/ui/NavSecondary";
import { NavUser } from "@/components/ui/NavUser";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Lists",
      url: "/lists",
      icon: ScrollText,
    },
  ],
  navSecondary: [
    {
      title: "Send Feedback",
      url: "/feedback",
      icon: HelpCircleIcon,
    },
  ],
  documents: [],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <MicroscopeIcon className="h-5 w-5" />
                <span className="text-base font-semibold">LeetSight</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavDocuments items={data.documents} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
