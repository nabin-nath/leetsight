"use client";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { ModeToggle } from "./theme-toggle";
import { FaGithub } from "react-icons/fa";
import { Button } from "./button";

const HEADER_TITLES: { [key: string]: string } = {
  "/": "Recent Interview Experiences",
  "/lists": "Lists",
  // Add more routes and titles here as needed
};

export function SiteHeader() {
  const pathname = usePathname();

  // Find the title for the current path, fallback to a default if not found
  const headerTitle = HEADER_TITLES[pathname] || "LeetSight";

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{headerTitle}</h1>
      </div>
      <div className="mr-3 flex items-center gap-2">
        <Button
          onClick={() => {
            window.open(`https://github.com/nabin-nath/leetsight`, "_blank");
          }}
          className="cursor-pointer"
          variant="outline"
          size="icon"
        >
          <FaGithub />
        </Button>
        <ModeToggle />
      </div>
    </header>
  );
}
