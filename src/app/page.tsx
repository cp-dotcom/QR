"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  QrCode,
  Star,
  Download,
  HardDrive,
  Plus,
  Scan,
  History as HistoryIcon,
  ChevronRight,
  TrendingUp,
  FileText,
  Image as ImageIcon,
  Link2,
} from "lucide-react";
import { useQrVault } from "../context/QrVaultContext";
import { Button } from "../components/ui/Button";
import { QrType } from "../types";

// Helper to format bytes
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// Helper for type icons
export const QrTypeIcon: React.FC<{ type: QrType; className?: string }> = ({ type, className = "w-4 h-4" }) => {
  switch (type) {
    case "url":
      return <Link2 className={className} />;
    case "pdf":
    case "doc":
      return <FileText className={className} />;
    case "image":
      return <ImageIcon className={className} />;
    default:
      return <QrCode className={className} />;
  }
};

const getTypeName = (type: QrType): string => {
  if (type === "pdf") return "PDF Document";
  if (type === "doc") return "Office Document";
  if (type === "wifi") return "WiFi Network";
  if (type === "sms") return "SMS Message";
  return type.toUpperCase();
};

export default function Dashboard() {
  const { qrList, analytics, toggleFavorite, deleteQrCode } = useQrVault();

  // Get recent 4 QR codes
  const recentQrs = qrList.slice(0, 4);
  // Get pinned (favorite) QRs
  const pinnedQrs = qrList.filter((qr) => qr.favorite).slice(0, 4);

  // Compute storage percentage (assuming 5MB limit for estimation)
  const maxStorage = 5 * 1024 * 1024; // 5MB
  const storagePercent = Math.min(100, (analytics.storageUsedBytes / maxStorage) * 100);

  // Find max value in history count to scale chart correctly
  const maxHistoryCount = Math.max(...analytics.historyByDay.map((h) => h.count), 1);

  return (
    <div className="space-y-8 select-none">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 to-violet-800 p-6 md:p-8 text-white shadow-xl shadow-primary/10">
        <div className="relative z-10 max-w-xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-primary-foreground/80 bg-white/10 px-3 py-1 rounded-full">
            Local & Privacy First
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Welcome to QR Vault</h2>
          <p className="text-sm text-primary-foreground/90 leading-relaxed">
            Generate customized QR codes containing web links, contact cards, calendar events, or local files. Everything runs safely offline in your browser.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/generate">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white text-primary hover:bg-white/90 shadow-md font-semibold"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create QR Code
              </Button>
            </Link>
            <Link href="/scanner">
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 text-white hover:bg-white/10 font-semibold"
                leftIcon={<Scan className="w-4 h-4" />}
              >
                Scan Camera
              </Button>
            </Link>
          </div>
        </div>

        {/* Floating background design accents */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 hidden md:flex items-center justify-center opacity-15 pointer-events-none">
          <QrCode className="w-48 h-48 rotate-12" />
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Codes */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total QRs</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <QrCode className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              {analytics.totalCount}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Created items list</span>
            </p>
          </div>
        </div>

        {/* Favorites */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Favorites</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Star className="w-5 h-5 fill-amber-500/10" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              {analytics.favoritesCount}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Pinned for quick access</p>
          </div>
        </div>

        {/* Downloads */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Downloads</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Download className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              {analytics.totalDownloads}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Total downloads registered</p>
          </div>
        </div>

        {/* Storage usage */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Storage Used</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              {formatBytes(analytics.storageUsedBytes)}
            </h3>
            {/* Storage Progress bar */}
            <div className="mt-2.5 w-full bg-secondary rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 flex justify-between">
              <span>{storagePercent.toFixed(1)}% of 5MB Limit</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Charts: Left Side (Col span 2) */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* Activity Bar Chart */}
          <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-foreground">Creation Trend</h3>
                <p className="text-xs text-muted-foreground">QR codes generated this week</p>
              </div>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                Last 7 Days
              </span>
            </div>

            {/* Render Custom SVG Bar Chart */}
            <div className="flex items-end justify-between h-40 pt-4 px-2">
              {analytics.historyByDay.map((h, index) => {
                const heightPercent = (h.count / maxHistoryCount) * 100;
                return (
                  <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                    {/* Tooltip on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-md -translate-y-1 z-10">
                      {h.count} QRs
                    </div>
                    {/* Bar */}
                    <div className="w-full max-w-[28px] bg-secondary rounded-t-md h-28 flex items-end overflow-hidden cursor-pointer">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ delay: index * 0.05, duration: 0.5 }}
                        className="w-full bg-gradient-to-t from-primary to-primary/80 rounded-t-md group-hover:brightness-110 transition-all"
                      />
                    </div>
                    {/* Weekday Label */}
                    <span className="text-[10px] font-bold text-muted-foreground">{h.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Type Distribution */}
          <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4">Format Distribution</h3>
            {analytics.totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground text-xs">
                <QrCode className="w-8 h-8 opacity-25 mb-2" />
                <span>No QR codes generated yet</span>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(analytics.typeDistribution).map(([type, count]) => {
                  const percentage = (count / analytics.totalCount) * 100;
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-foreground">
                        <span className="flex items-center gap-2">
                          <QrTypeIcon type={type as QrType} className="w-3.5 h-3.5 text-muted-foreground" />
                          {getTypeName(type as QrType)}
                        </span>
                        <span>
                          {count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5 }}
                          className="bg-primary h-full rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Lists: Right Side (Col span 1) */}
        <div className="space-y-6 md:space-y-8">
          {/* Recent QR Codes */}
          <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground">Recent QR Codes</h3>
              <Link href="/history" className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
                View All
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentQrs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-muted-foreground text-xs text-center border-2 border-dashed border-border/80 rounded-xl">
                <HistoryIcon className="w-8 h-8 opacity-20 mb-2" />
                <span>No recent codes</span>
                <Link href="/generate" className="text-xs text-primary hover:underline font-semibold mt-1">
                  Create one now
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentQrs.map((qr) => (
                  <div key={qr.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-secondary text-primary">
                        <QrTypeIcon type={qr.type} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate max-w-[120px] md:max-w-[160px]">
                          {qr.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(qr.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleFavorite(qr.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-secondary ${
                          qr.favorite ? "text-amber-500" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pinned / Favorites */}
          <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-foreground mb-4">Pinned Items</h3>

            {pinnedQrs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-muted-foreground text-xs text-center border-2 border-dashed border-border/80 rounded-xl">
                <Star className="w-8 h-8 opacity-20 mb-2" />
                <span>No pinned items yet</span>
                <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[160px] mx-auto">
                  Star codes in your history to pin them here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pinnedQrs.map((qr) => (
                  <div key={qr.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                        <QrTypeIcon type={qr.type} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate max-w-[120px] md:max-w-[160px]">
                          {qr.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground capitalize">{qr.type} QR</p>
                      </div>
                    </div>
                    <Link href={`/history?id=${qr.id}`} className="text-xs font-semibold text-primary hover:underline">
                      Open
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
