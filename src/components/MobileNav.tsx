"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, BarChart3, Clock, Trash2, Settings } from "lucide-react";

function NavItem({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0 text-[10px] leading-tight transition-colors py-1 px-0.5 ${
        active
          ? "text-neutral-900 dark:text-neutral-100"
          : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
      }`}
    >
      <span className={`transition-colors ${
        active
          ? "text-neutral-900 dark:text-neutral-100"
          : "text-neutral-600 dark:text-neutral-400"
      }`}>
        {children}
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-white dark:bg-neutral-900 border-t dark:border-neutral-700 safe-area-bottom">
      <NavItem href="/" label="Accueil"><Home className="w-4 h-4" /></NavItem>
      <NavItem href="/search" label="Recherche"><Search className="w-4 h-4" /></NavItem>
      <NavItem href="/stats" label="Stats"><BarChart3 className="w-4 h-4" /></NavItem>
      <NavItem href="/versions" label="Historique"><Clock className="w-4 h-4" /></NavItem>
      <NavItem href="/trash" label="Corbeille"><Trash2 className="w-4 h-4" /></NavItem>
      <NavItem href="/settings" label="Paramètres"><Settings className="w-4 h-4" /></NavItem>
    </nav>
  );
}
