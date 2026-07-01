"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Download,
  Star,
  QrCode,
  HardDrive,
  Calendar,
  Layers,
} from "lucide-react";
import { useQrVault } from "../../context/QrVaultContext";
import { QrTypeIcon } from "../page";
import { QrType } from "../../types";

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const getTypeName = (type: QrType): string => {
  if (type === "pdf") return "PDF Document";
  if (type === "doc") return "Office Document";
  if (type === "wifi") return "WiFi Network";
  if (type === "sms") return "SMS Message";
  return type.toUpperCase();
};

export default function AnalyticsPage() {
  const { qrList, analytics } = useQrVault();

  // Find max value in history count to scale chart correctly
  const maxHistoryCount = Math.max(...analytics.historyByDay.map((h) => h.count), 1);

  // Find most downloaded QR
  const sortedByDownloads = [...qrList].sort((a, b) => b.downloadsCount - a.downloadsCount);
  const mostPopular = sortedByDownloads[0] || null;

  return (
    <div className="space-y-8 select-none max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-foreground">Insights & Analytics</h1>
        <p className="text-xs text-muted-foreground">Monitor generated codes, storage space, and download metrics</p>
      </div>

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Codes</span>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-2xl font-extrabold text-foreground">{analytics.totalCount}</h3>
            <QrCode className="w-5 h-5 text-primary opacity-60" />
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Favorites</span>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-2xl font-extrabold text-foreground">{analytics.favoritesCount}</h3>
            <Star className="w-5 h-5 text-amber-500 opacity-60 fill-amber-500/10" />
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Downloads</span>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-2xl font-extrabold text-foreground">{analytics.totalDownloads}</h3>
            <Download className="w-5 h-5 text-emerald-500 opacity-60" />
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Storage Space</span>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-2xl font-extrabold text-foreground">{formatBytes(analytics.storageUsedBytes)}</h3>
            <HardDrive className="w-5 h-5 text-sky-500 opacity-60" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* Weekly activity bar chart (Span 2) */}
        <div className="md:col-span-2 bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-foreground">Creation History</h3>
              <p className="text-xs text-muted-foreground">Weekly tracking of generated codes</p>
            </div>
            <div className="p-2 rounded-xl bg-secondary text-primary">
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-end justify-between h-44 pt-4 px-2">
            {analytics.historyByDay.map((h, index) => {
              const heightPercent = (h.count / maxHistoryCount) * 100;
              return (
                <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-md -translate-y-1">
                    {h.count} QRs
                  </div>
                  <div className="w-full max-w-[32px] bg-secondary rounded-t-md h-32 flex items-end overflow-hidden cursor-pointer">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ delay: index * 0.05, duration: 0.5 }}
                      className="w-full bg-gradient-to-t from-primary to-primary/80 rounded-t-md"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">{h.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Format distribution progress (Span 1) */}
        <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground">Format Breakdown</h3>
              <Layers className="w-4.5 h-4.5 text-primary opacity-60" />
            </div>

            {analytics.totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-xs">
                <QrCode className="w-8 h-8 opacity-20 mb-2" />
                <span>No codes generated yet</span>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[180px] pr-1.5">
                {Object.entries(analytics.typeDistribution).map(([type, count]) => {
                  const percentage = (count / analytics.totalCount) * 100;
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-foreground">
                        <span className="flex items-center gap-2">
                          <QrTypeIcon type={type as QrType} className="w-3 h-3 text-muted-foreground" />
                          {getTypeName(type as QrType)}
                        </span>
                        <span>{count}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Extra detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Popular Code Card */}
        <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4.5 h-4.5 text-emerald-500" />
            <span>Most Popular Code</span>
          </h3>

          {mostPopular ? (
            <div className="p-4 bg-secondary/30 rounded-xl border border-border flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <QrTypeIcon type={mostPopular.type} className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-sm text-foreground truncate">{mostPopular.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                  Value: {mostPopular.content}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {mostPopular.downloadsCount} Downloads
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Created {new Date(mostPopular.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-xs">
              <span>No downloads registered yet</span>
            </div>
          )}
        </div>

        {/* Database Integrity Card */}
        <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-4.5 h-4.5 text-indigo-500" />
            <span>Database Statistics</span>
          </h3>
          <div className="space-y-3.5 text-xs font-semibold">
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Estimated Metadata Bytes</span>
              <span className="text-foreground">
                {formatBytes(JSON.stringify(qrList).length)}
              </span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Estimated Binary File Bytes</span>
              <span className="text-foreground">
                {formatBytes(qrList.reduce((acc, curr) => acc + (curr.fileData?.size || 0), 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IndexedDB Collections</span>
              <span className="text-foreground">1 (Files DB)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
