"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  PlusCircle, 
  MessageSquare, 
  Library, 
  Tag, 
  FileText, 
  Video, 
  FileCode, 
  Globe, 
  File,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrainLogo } from "./BrainLogo";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

const Sidebar = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Hide sidebar on login page
  if (pathname === "/login") return null;

  const mainLinks = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Capture", href: "/capture", icon: PlusCircle },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Knowledge", href: "/knowledge", icon: Library },
    { name: "Topics", href: "/topics", icon: Tag },
  ];

  const categories = [
    { name: "All", href: "/knowledge?type=all", icon: Library },
    { name: "Notes", href: "/knowledge?type=note", icon: FileText },
    { name: "YouTube", href: "/knowledge?type=youtube", icon: Video },
    { name: "PDFs", href: "/knowledge?type=pdf", icon: File },
    { name: "Articles", href: "/knowledge?type=article", icon: Globe },
    { name: "Code", href: "/knowledge?type=code", icon: FileCode },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.includes("?")) {
      const [path, query] = href.split("?");
      const [key, value] = query.split("=");
      const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      return pathname === path && searchParams.get(key) === value;
    }
    return pathname === href;
  };

  return (
    <div className="w-64 bg-[#EDE8E0] border-r border-[#E8E2D9] h-screen flex flex-col p-4 sticky top-0">
      <div className="mb-10 flex items-center gap-3 px-2">
        <BrainLogo className="w-8 h-8" />
        <h1 className="text-xl font-serif font-bold tracking-tight text-[#2C2420]">FlowMind</h1>
      </div>

      <nav className="flex-1 space-y-8 overflow-y-auto scrollbar-hide">
        <div>
          <h2 className="px-3 text-[10px] font-bold text-[#A69E94] uppercase tracking-[0.2em] mb-3">Main</h2>
          <div className="space-y-1.5">
            {mainLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                  isActive(link.href)
                    ? "bg-[#C4714F] text-white shadow-md shadow-orange-900/10" 
                    : "text-[#5C544E] hover:text-[#2C2420] hover:bg-[#E2DCD3]"
                )}
              >
                <link.icon size={18} className={cn(
                  "transition-colors",
                  isActive(link.href) ? "text-white" : "text-[#8C847E] group-hover:text-[#2C2420]"
                )} />
                <span className="font-medium text-sm">{link.name}</span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="px-3 text-[10px] font-bold text-[#A69E94] uppercase tracking-[0.2em] mb-3">Library</h2>
          <div className="space-y-1">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all group",
                  isActive(cat.href)
                    ? "bg-[#C4714F]/10 text-[#C4714F] font-bold"
                    : "text-[#5C544E] hover:text-[#2C2420] hover:bg-[#E2DCD3]"
                )}
              >
                <cat.icon size={18} className={cn(
                  "transition-colors",
                  isActive(cat.href) ? "text-[#C4714F]" : "text-[#8C847E] group-hover:text-[#2C2420]"
                )} />
                <span className="font-medium text-sm">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="mt-auto pt-6 border-t border-[#E8E2D9] space-y-4">
        {session?.user && (
          <div className="flex items-center gap-3 px-2 py-2">
            {session.user.image ? (
              <Image 
                src={session.user.image} 
                alt={session.user.name || "User"} 
                width={36} 
                height={36} 
                className="rounded-full border border-[#E8E2D9]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#D6CEC3] flex items-center justify-center text-xs font-bold text-[#5C544E]">
                {session.user.name?.[0] || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#2C2420] truncate">{session.user.name}</p>
              <p className="text-[10px] font-bold text-[#A69E94] uppercase truncate">{session.user.email}</p>
            </div>
          </div>
        )}
        
        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#8C847E] hover:text-red-500 hover:bg-red-50 transition-all group"
        >
          <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
