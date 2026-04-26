"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";

// Applies the user's font scale by setting the root html font-size. Tailwind
// sizes are rem-based so this transparently scales the entire app.
function FontScaleApplier() {
  const fontScale = useAppStore((s) => s.fontScale);
  useEffect(() => {
    document.documentElement.style.fontSize = `${(fontScale * 16).toFixed(2)}px`;
    return () => {
      document.documentElement.style.fontSize = "";
    };
  }, [fontScale]);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
            refetchOnWindowFocus: false,
            retry: 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <FontScaleApplier />
      {children}
    </QueryClientProvider>
  );
}
