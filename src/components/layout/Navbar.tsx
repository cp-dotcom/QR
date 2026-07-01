"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sun, Moon, Scan, Settings as SettingsIcon } from "lucide-react";
import { useQrVault } from "../../context/QrVaultContext";
import { Button } from "../ui/Button";

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const pathname = usePathname();
  const { settings, updateSettings } = useQrVault();

  // Get human readable title based on path
  const getPageTitle = (path: string) => {
    switch (path) {
      case "/":
        return "Dashboard";
      case "/generate":
        return "Generate QR Code";
      case "/history":
        return "QR Vault History";
      case "/collections":
        return "My Collections";
      case "/scanner":
        return "QR Camera Scanner";
      case "/analytics":
        return "Insights & Analytics";
      case "/settings":
        return "Application Settings";
      case "/about":
        return "About QR Vault";
      default:
        return "QR Vault";
    }
  };

  const toggleTheme = () => {
    const nextTheme = settings.theme === "light" ? "dark" : "light";
    updateSettings({ theme: nextTheme });
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border glassmorphism dark:glassmorphism px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Left: Mobile hamburger menu and breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium select-none">
            <span>QR Vault</span>
            <span>/</span>
            <span className="capitalize">
              {pathname === "/" ? "home" : pathname.replace("/", "")}
            </span>
          </div>
          <h2 className="text-base font-bold text-foreground tracking-tight select-none">
            {getPageTitle(pathname)}
          </h2>
        </div>
      </div>

      {/* Right: Quick actions */}
      <div className="flex items-center gap-2">
        {/* Quick Scanner Shortcut */}
        {pathname !== "/scanner" && (
          <Link href="/scanner">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex gap-1.5 h-9 rounded-lg"
              leftIcon={<Scan className="w-4 h-4 text-primary" />}
            >
              Scan QR
            </Button>
          </Link>
        )}

        {/* Theme Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg"
          title={`Switch to ${settings.theme === "light" ? "Dark" : "Light"} Mode`}
        >
          {settings.theme === "light" ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
        </Button>

        {/* Quick Settings Shortcut */}
        {pathname !== "/settings" && (
          <Link href="/settings">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg"
            >
              <SettingsIcon className="w-4.5 h-4.5" />
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};
