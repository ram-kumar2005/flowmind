"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/login") {
      router.push("/login");
    }
  }, [status, pathname, router]);

  if (status === "loading") {
    return (
      <div className="flex flex-col h-screen bg-[#F5F0EA] items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C4714F]/20 border-t-[#C4714F] rounded-full animate-spin" />
        <p className="mt-4 text-[#A69E94] font-serif italic">Entering your mind palace...</p>
      </div>
    );
  }

  return <>{children}</>;
}
