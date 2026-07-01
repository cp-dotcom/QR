"use client";

import React from "react";
import { ShieldCheck, Database, Zap, Keyboard, HelpCircle, HardDrive, QrCode } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="space-y-8 max-w-3xl mx-auto select-none">
      {/* Header Banner */}
      <div className="border-b border-border pb-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20 mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-foreground">About QR Vault</h1>
        <p className="text-xs text-muted-foreground">The Privacy-first, local document QR generation workspace</p>
      </div>

      {/* Philosophy cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 w-fit">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-foreground">100% Client-Side</h3>
          <p className="text-[11px] text-muted-foreground leading-normal">
            No telemetry, trackers, external databases or APIs. Your data never leaves your computer, making it fully private.
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 w-fit">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-foreground">Hybrid Storage</h3>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Uses Local Storage for settings and QR list cards, and IndexedDB for large images or documents up to 2MB.
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 w-fit">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-foreground">Confetti & Style</h3>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Supports linear/radial gradient fills, rounded dot shape structures, center logo overlays, and export/import packages.
          </p>
        </div>
      </div>

      {/* Tech stack */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
          <HardDrive className="w-4.5 h-4.5 text-primary" />
          <span>Technology Architecture</span>
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          QR Vault is developed with Next.js App Router, TypeScript, and Tailwind CSS.
          QR code encoding is powered by the fast and light <code className="bg-secondary px-1.5 py-0.5 rounded font-mono text-[10px]">qrcode</code> package, while camera stream parsing is implemented using the robust <code className="bg-secondary px-1.5 py-0.5 rounded font-mono text-[10px]">html5-qrcode</code> framework. Bulk operations utilize <code className="bg-secondary px-1.5 py-0.5 rounded font-mono text-[10px]">jszip</code>.
        </p>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
          <Keyboard className="w-4.5 h-4.5 text-primary" />
          <span>Helpful Commands</span>
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-muted-foreground flex items-center gap-1.5">
              Theme Swapping Shortcut
            </span>
            <kbd className="bg-secondary border border-border px-2 py-1 rounded-md text-[10px] font-mono shadow-sm">
              Click Toggle Icon
            </kbd>
          </div>
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-muted-foreground">Import Backup Data</span>
            <kbd className="bg-secondary border border-border px-2 py-1 rounded-md text-[10px] font-mono shadow-sm">
              Click Restore DB
            </kbd>
          </div>
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-muted-foreground">Copy QR Image</span>
            <kbd className="bg-secondary border border-border px-2 py-1 rounded-md text-[10px] font-mono shadow-sm">
              Click Copy Preview
            </kbd>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
          <HelpCircle className="w-4.5 h-4.5 text-primary" />
          <span>Frequently Asked Questions</span>
        </h3>
        <div className="space-y-4 text-xs leading-relaxed">
          <div className="space-y-1">
            <h4 className="font-bold text-foreground">Why do my file QR codes not open on other phones?</h4>
            <p className="text-muted-foreground">
              Because this app is frontend-only and has no web server! Files are saved strictly in your current browsers IndexedDB. To share files, we suggest backing up your DB under History, and importing it on the secondary device, or using a cloud URL.
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-foreground">How many QR codes can I save?</h4>
            <p className="text-muted-foreground">
              You can save thousands of text-based codes. File uploads are limited to 2MB each and overall storage is bounded only by your browser disk allowances for IndexedDB, which is typically several hundred megabytes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
