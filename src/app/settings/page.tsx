"use client";

import React, { useState } from "react";
import {
  Palette,
  Sliders,
  RotateCcw,
  ShieldAlert,
  Grid,
  List,
  Save,
  Check,
} from "lucide-react";
import { useQrVault } from "../../context/QrVaultContext";
import { useToast } from "../../components/ui/Toast";
import { Button } from "../../components/ui/Button";
import { Input, Label } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Dialog } from "../../components/ui/Dialog";

const ACCENTS = [
  { id: "indigo", name: "Indigo", colorClass: "bg-indigo-600 border-indigo-200" },
  { id: "violet", name: "Violet", colorClass: "bg-violet-600 border-violet-200" },
  { id: "emerald", name: "Emerald", colorClass: "bg-emerald-600 border-emerald-200" },
  { id: "amber", name: "Amber", colorClass: "bg-amber-600 border-amber-200" },
  { id: "rose", name: "Rose", colorClass: "bg-rose-600 border-rose-200" },
  { id: "sky", name: "Sky", colorClass: "bg-sky-600 border-sky-200" },
] as const;

export default function SettingsPage() {
  const { settings, updateSettings, clearAllData } = useQrVault();
  const { toast } = useToast();

  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");

  const handleClearAll = async () => {
    if (confirmInput.toUpperCase() !== "DELETE") {
      toast("Confirmation failed", "error", "Please type DELETE to proceed.");
      return;
    }

    try {
      await clearAllData();
      setClearConfirmOpen(false);
      setConfirmInput("");
      toast("Vault Restructured", "success", "All data and file attachments have been permanently erased.");
    } catch (e) {
      console.error(e);
      toast("Reset failed", "error");
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto select-none">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-foreground">Settings Workspace</h1>
        <p className="text-xs text-muted-foreground">Customize your vaults colors, interfaces, and defaults</p>
      </div>

      {/* 1. Theme and Interface */}
      <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
          <Palette className="w-4.5 h-4.5 text-primary" />
          <span>Interface Themes</span>
        </h3>

        {/* Theme select */}
        <div>
          <Label>Selected App Theme</Label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => updateSettings({ theme: t })}
                className={`py-3 px-4 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer capitalize ${
                  settings.theme === t
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/10"
                    : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color picker */}
        <div>
          <Label>Brand Accent color</Label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-2">
            {ACCENTS.map((acc) => {
              const isActive = settings.accentColor === acc.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => updateSettings({ accentColor: acc.id })}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer ${
                    isActive ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border shadow-inner ${acc.colorClass} flex items-center justify-center`}>
                    {isActive && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-[10px] font-bold text-foreground">{acc.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Default View Mode */}
        <div>
          <Label>Default List View preference</Label>
          <div className="flex bg-secondary p-1 rounded-xl w-fit mt-2 border border-border">
            <button
              onClick={() => updateSettings({ viewMode: "grid" })}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                settings.viewMode === "grid" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Grid Cards
            </button>
            <button
              onClick={() => updateSettings({ viewMode: "list" })}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                settings.viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List Rows
            </button>
          </div>
        </div>
      </div>

      {/* 2. QR Creator Defaults */}
      <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
          <Sliders className="w-4.5 h-4.5 text-primary" />
          <span>Creator Defaults</span>
        </h3>

        {/* Size and ECC Defaults */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="flex justify-between">
              <span>Default Pixel Size</span>
              <span className="font-mono text-primary font-bold">{settings.defaultSize}px</span>
            </Label>
            <input
              type="range"
              min="200"
              max="800"
              step="50"
              className="w-full accent-primary mt-2 cursor-pointer"
              value={settings.defaultSize}
              onChange={(e) => updateSettings({ defaultSize: parseInt(e.target.value) })}
            />
          </div>

          <Select
            label="Default ECC Level"
            options={[
              { value: "L", label: "Low (7% recovery)" },
              { value: "M", label: "Medium (15% recovery)" },
              { value: "Q", label: "Quartile (25% recovery)" },
              { value: "H", label: "High (30% recovery - recommended)" },
            ]}
            value={settings.defaultErrorCorrection}
            onChange={(e) => updateSettings({ defaultErrorCorrection: e.target.value as any })}
          />
        </div>

        {/* Color Defaults */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Default Dots Color</Label>
            <div className="flex gap-2 items-center mt-1.5">
              <input
                type="color"
                className="w-9 h-9 rounded-lg border border-border cursor-pointer"
                value={settings.defaultDotsColor}
                onChange={(e) => updateSettings({ defaultDotsColor: e.target.value })}
              />
              <input
                type="text"
                className="border border-border rounded-lg px-2.5 py-1 text-xs w-24 text-foreground bg-card"
                value={settings.defaultDotsColor}
                onChange={(e) => updateSettings({ defaultDotsColor: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Default Background Color</Label>
            <div className="flex gap-2 items-center mt-1.5">
              <input
                type="color"
                className="w-9 h-9 rounded-lg border border-border cursor-pointer"
                value={settings.defaultBgColor}
                onChange={(e) => updateSettings({ defaultBgColor: e.target.value })}
              />
              <input
                type="text"
                className="border border-border rounded-lg px-2.5 py-1 text-xs w-24 text-foreground bg-card"
                value={settings.defaultBgColor}
                onChange={(e) => updateSettings({ defaultBgColor: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Auto-save */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <Label className="mb-0">Auto-save history on generation</Label>
            <p className="text-[10px] text-muted-foreground">Automatically write data to vault history upon generation.</p>
          </div>
          <input
            type="checkbox"
            className="w-5.5 h-5.5 accent-primary cursor-pointer"
            checked={settings.autoSave}
            onChange={(e) => updateSettings({ autoSave: e.target.checked })}
          />
        </div>
      </div>

      {/* 3. Dangerous Actions */}
      <div className="bg-card rounded-2xl border border-destructive/20 p-5 md:p-6 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-rose-500 flex items-center gap-2 border-b border-border pb-3">
          <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />
          <span>Danger Zone</span>
        </h3>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="max-w-md">
            <h4 className="text-xs font-bold text-foreground">Format Application Database</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
              Destroys all QR Codes, collections, layout preferences, and attached binary files (PDFs, docs, images) from local storage and IndexedDB databases.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setClearConfirmOpen(true)}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Clear Database
          </Button>
        </div>
      </div>

      {/* --- CONFIRM CLEAR DIALOG --- */}
      <Dialog
        isOpen={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        title="Confirm DB Purge"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setClearConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAll}>
              Erase Everything
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground/80 leading-relaxed">
            This action is <strong>irreversible</strong> and will delete all files and generated cards.
          </p>
          <div className="space-y-2">
            <Label required>Type DELETE to verify</Label>
            <Input
              placeholder="DELETE"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
