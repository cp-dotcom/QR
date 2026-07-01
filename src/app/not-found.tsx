"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, QrCode } from "lucide-react";
import { Button } from "../components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-6 select-none max-w-md mx-auto">
      {/* Broken QR graphic */}
      <div className="relative">
        <div className="w-24 h-24 rounded-2xl bg-secondary/80 flex items-center justify-center text-muted-foreground border border-border">
          <QrCode className="w-12 h-12 opacity-35" />
        </div>
        <div className="absolute -bottom-2 -right-2 p-2 bg-rose-500 text-white rounded-xl shadow-lg border-4 border-background animate-bounce">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">404 - Page Missing</h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The link you followed is broken, or the page was relocated. No worries, everything remains safe inside your vault.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <Link href="/">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Home
          </Button>
        </Link>
        <Link href="/generate">
          <Button size="sm">Create QR Code</Button>
        </Link>
      </div>
    </div>
  );
}
