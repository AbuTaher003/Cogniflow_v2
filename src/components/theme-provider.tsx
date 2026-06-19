"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "cogniflow-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const supabase = createClient();
    
    // 1. Initial load from local storage
    const stored = localStorage.getItem(storageKey) as Theme;
    if (stored) {
      setThemeState(stored);
    }

    // 2. Fetch and sync theme from database
    async function syncThemeFromDb(userId: string, currentStored: Theme) {
      try {
        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("theme")
          .eq("user_id", userId)
          .single();

        if (prefs?.theme && prefs.theme !== currentStored) {
          setThemeState(prefs.theme as Theme);
          localStorage.setItem(storageKey, prefs.theme);
        }
      } catch (err) {
        console.error("Failed to sync theme from database:", err);
      }
    }

    async function initialSync() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await syncThemeFromDb(user.id, stored);
      }
    }
    initialSync();

    // 3. Listen for auth state changes (e.g. login)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await syncThemeFromDb(session.user.id, localStorage.getItem(storageKey) as Theme);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [storageKey]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("user_preferences")
          .upsert({
            user_id: user.id,
            theme: newTheme,
            updated_at: new Date().toISOString()
          });
      }
    } catch (err) {
      console.error("Failed to save theme choice to database:", err);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }} {...props}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
