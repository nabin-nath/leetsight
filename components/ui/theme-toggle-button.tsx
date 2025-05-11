// components/ui/theme-toggle-button.tsx (Create this new file)
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming you might have a shared Button component, or use a simple button

export function ThemeToggleButton() {
  const { setTheme, resolvedTheme, theme } = useTheme(); // Use resolvedTheme to know current actual theme
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder or null to avoid hydration mismatch
    // during server-side rendering and client-side hydration.
    // The size of the placeholder should match the button to prevent layout shift.
    return <div className="h-9 w-9 rounded-md bg-gray-200 animate-pulse"></div>;
  }

  const toggleTheme = () => {
    // Explicitly cycle: system -> light -> dark -> system
    if (theme === "system") {
      setTheme(resolvedTheme === "dark" ? "light" : "dark"); // If system is dark, go light, else go dark
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("light"); // Or back to system: setTheme("system")
    }
  };

  return (
    <Button
      variant="ghost" // Or your preferred button style
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="rounded-full p-2 hover:bg-gray-200 dark:hover:bg-gray-700" // Example styling
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      ) : (
        <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      )}
    </Button>
  );
}
