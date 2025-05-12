"use client";
import { useSession } from "next-auth/react";

import Link from "next/link";
import { useEffect, useState } from "react";
import UserProfile from "./userprofile";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const user = session?.user;

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [status]);

  const isActive = (href: string) => {
    // Exact match for home page, startsWith for others if you have sub-routes
    if (href === "/") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-3 mb-5">
      <div className="mx-2 px-4 flex justify-between items-center">
        <div className="flex items-center gap-2 md:gap-8">
          <Link href="/" prefetch className="text-xl font-bold">
            <span className="text-black-600">&lt;/&gt;</span> LeetSight
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-6 items-center">
            <Link
              href="/" // Assuming "/" is Recent Posts
              className={`text-sm font-medium pb-1 border-b-2 transition-colors duration-150
                ${
                  isActive("/")
                    ? "text-primary border-primary" // Active style
                    : "text-muted-foreground hover:text-foreground border-transparent hover:border-gray-300 dark:hover:border-gray-600" // Inactive style
                }`}
            >
              Recent posts
            </Link>
            <Link
              href="/questions"
              className={`text-sm font-medium pb-1 border-b-2 transition-colors duration-150
                ${
                  isActive("/questions")
                    ? "text-primary border-primary" // Active style
                    : "text-muted-foreground hover:text-foreground border-transparent hover:border-gray-300 dark:hover:border-gray-600" // Inactive style
                }`}
            >
              Questions
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-secondary animate-pulse"></div>
          ) : user ? (
            <UserProfile image={user.image ?? ""} />
          ) : (
            <>
              <Link
                href="/api/auth/signin"
                className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-accent"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
