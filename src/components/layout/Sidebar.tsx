"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  QrCode,
  History,
  FolderOpen,
  ScanLine,
  BarChart3,
  Settings,
  Info,
  X,
  ShieldCheck,
} from "lucide-react";
import { clsx } from "clsx";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SidebarLink {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const SIDEBAR_LINKS: SidebarLink[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Generate QR", href: "/generate", icon: QrCode },
  { name: "History", href: "/history", icon: History },
  { name: "Collections", href: "/collections", icon: FolderOpen },
  { name: "QR Scanner", href: "/scanner", icon: ScanLine },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "About", href: "/about", icon: Info },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  const renderContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border w-64 p-5 z-50">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center text-white shadow-md shadow-primary/20">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-foreground leading-none">QR Vault</h1>
            <span className="text-[10px] font-medium text-muted-foreground">SECURE GENERATOR</span>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 py-6 overflow-y-auto">
        {SIDEBAR_LINKS.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={clsx(
                "group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {link.name}
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-dot"
                  className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary-foreground"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="pt-4 border-t border-border flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 p-2.5 rounded-xl border border-border/50">
          <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
          <span>Local Persistence: 100% Offline</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 flex-shrink-0 z-20">
        {renderContent()}
      </aside>

      {/* Mobile Drawer (Overlay) */}
      <AnimatePresence>
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30"
            />
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative z-40 h-full flex flex-col"
            >
              {renderContent()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
