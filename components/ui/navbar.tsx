"use client";
import { useSession } from "next-auth/react";

import Link from "next/link";
import { useEffect, useState } from "react";
import UserProfile from "./userprofile";

export default function Navbar() {
  const { data: session, status } = useSession();
  console.log("Session data:", session);
  const [loading, setLoading] = useState(true);
  const user = session?.user;

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [status]);

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-3 mb-5">
      <div className="mx-2 px-4 flex justify-between items-center">
        <div className="flex items-center gap-2 md:gap-8">
          <Link href="/" prefetch className="text-xl font-bold">
            <span className="text-black-600">&lt;/&gt;</span> LeetSight
          </Link>

          {/* Navigation Links */}
          <div className="md:flex space-x-6">
            <Link
              href="/"
              className="text-sm font-medium text-black-600 border-b-2 border-black pb-1"
            >
              Questions
            </Link>
            <Link
              href="/recent-posts"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 pb-1 border-b-2 border-transparent hover:border-gray-300"
            >
              Recent Posts
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
          ) : user ? (
            <UserProfile image={session.user?.image ?? ""} />
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
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
