"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Grid,
  List,
  Star,
  Download,
  Trash2,
  Edit2,
  Copy,
  FolderInput,
  ExternalLink,
  ChevronDown,
  X,
  Sparkles,
  Calendar,
  Layers,
  ArrowUpDown,
  FileSpreadsheet,
  FileJson,
  Upload,
} from "lucide-react";

import { useQrVault } from "../../context/QrVaultContext";
import { useToast } from "../../components/ui/Toast";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Dialog } from "../../components/ui/Dialog";
import { QrCodeItem, QrType } from "../../types";
import { QrTypeIcon } from "../page";
import { drawQrOnCanvas } from "../../utils/qrDrawer";

export default function HistoryPage() {
  const {
    qrList,
    collections,
    toggleFavorite,
    deleteQrCode,
    duplicateQrCode,
    moveQrCode,
    updateQrCode,
    recordDownload,
    importData,
    exportData,
  } = useQrVault();

  const { toast } = useToast();
  const searchParams = useSearchParams();

  // --- QUERY OR URL FILTERS ---
  const initialId = searchParams.get("id");

  // --- STATE ---
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title" | "downloads">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Multi-select bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkMoveOpen, setIsBulkMoveOpen] = useState(false);

  // Modals state
  const [previewItem, setPreviewItem] = useState<QrCodeItem | null>(null);
  const [editItem, setEditItem] = useState<QrCodeItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Form edit fields
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editTags, setEditTags] = useState("");

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // If URL search param 'id' is set, auto-open the preview modal
  useEffect(() => {
    if (initialId && qrList.length > 0) {
      const match = qrList.find((qr) => qr.id === initialId);
      if (match) setPreviewItem(match);
    }
  }, [initialId, qrList]);

  // Render canvas inside preview modal
  useEffect(() => {
    if (previewItem && previewCanvasRef.current) {
      // Small timeout to let canvas render in DOM
      setTimeout(() => {
        if (previewCanvasRef.current) {
          drawQrOnCanvas(previewCanvasRef.current, previewItem.content, previewItem.styling);
        }
      }, 100);
    }
  }, [previewItem]);

  // Populate edit fields
  useEffect(() => {
    if (editItem) {
      setEditTitle(editItem.title);
      setEditDesc(editItem.description || "");
      setEditNotes(editItem.notes || "");
      setEditTags(editItem.tags.join(", "));
    }
  }, [editItem]);

  // --- FILTER & SORT LOGIC ---
  const filteredQrs = qrList
    .filter((qr) => {
      // Search text matches (Title, desc, tags, type, content)
      const query = search.toLowerCase();
      const matchSearch =
        qr.title.toLowerCase().includes(query) ||
        (qr.description || "").toLowerCase().includes(query) ||
        (qr.notes || "").toLowerCase().includes(query) ||
        qr.tags.some((t) => t.toLowerCase().includes(query)) ||
        qr.type.toLowerCase().includes(query) ||
        qr.content.toLowerCase().includes(query);

      const matchType = selectedType === "all" || qr.type === selectedType;
      const matchCollection =
        selectedCollection === "all" ||
        (selectedCollection === "uncategorized" && !qr.collectionId) ||
        qr.collectionId === selectedCollection;

      const matchFav = !onlyFavorites || qr.favorite;

      return matchSearch && matchType && matchCollection && matchFav;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "downloads") {
        return b.downloadsCount - a.downloadsCount;
      }
      return 0;
    });

  // --- MULTI SELECT BULK ACTIONS ---
  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredQrs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredQrs.map((qr) => qr.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) {
      for (const id of selectedIds) {
        await deleteQrCode(id);
      }
      setSelectedIds([]);
      toast("Bulk Deletion Successful", "success", "Items removed from history.");
    }
  };

  const handleBulkMove = (collectionId?: string) => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => {
      moveQrCode(id, collectionId);
    });
    setSelectedIds([]);
    setIsBulkMoveOpen(false);
    toast("Items Moved", "success", "Updated collections for selected items.");
  };

  // --- ACTIONS ---
  const handleEditSubmit = () => {
    if (!editItem) return;
    const tagsArray = editTags
      ? editTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    updateQrCode(editItem.id, {
      title: editTitle.trim() || editItem.title,
      description: editDesc.trim(),
      notes: editNotes.trim(),
      tags: tagsArray,
    });

    toast("QR Metadata Updated", "success");
    setEditItem(null);
  };

  const handleDownloadInHistory = (qr: QrCodeItem) => {
    // Generate simple download
    const dummyCanvas = document.createElement("canvas");
    dummyCanvas.width = qr.styling.size || 400;
    dummyCanvas.height = qr.styling.size || 400;
    drawQrOnCanvas(dummyCanvas, qr.content, qr.styling).then(() => {
      const url = dummyCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${qr.title}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      recordDownload(qr.id);
      toast("Download started", "success");
    });
  };

  // --- EXPORT CSV ---
  const handleExportCsv = () => {
    if (filteredQrs.length === 0) {
      toast("No data", "warning", "No QR codes found to export.");
      return;
    }

    const headers = ["ID", "Title", "Type", "Encoded Content", "Created At", "Downloads", "Favorite", "Tags"];
    const rows = filteredQrs.map((qr) => [
      qr.id,
      `"${qr.title.replace(/"/g, '""')}"`,
      qr.type,
      `"${qr.content.replace(/"/g, '""')}"`,
      qr.createdAt,
      qr.downloadsCount,
      qr.favorite ? "Yes" : "No",
      `"${qr.tags.join(", ")}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `qrvault_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("CSV Exported", "success");
  };

  // --- EXPORT JSON ---
  const handleExportJson = async () => {
    try {
      const jsonString = await exportData();
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qrvault_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast("JSON Database Exported", "success");
    } catch (e) {
      console.error(e);
      toast("Export failed", "error");
    }
  };

  // --- IMPORT JSON ---
  const handleImportJsonChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;

      const res = await importData(content);
      if (res.success) {
        toast("Database Imported", "success", res.message);
        setImportOpen(false);
      } else {
        toast("Import Failed", "error", res.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Action Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Vault History</h1>
          <p className="text-xs text-muted-foreground">Manage and filter your saved codes</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* CSV Export */}
          <Button variant="outline" size="sm" onClick={handleExportCsv} leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-500" />}>
            Export CSV
          </Button>

          {/* Backup Database */}
          <Button variant="outline" size="sm" onClick={handleExportJson} leftIcon={<FileJson className="w-4 h-4 text-indigo-500" />}>
            Backup Database
          </Button>

          {/* Restore Database */}
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} leftIcon={<Upload className="w-4 h-4 text-primary" />}>
            Restore DB
          </Button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-card rounded-2xl border border-border p-4 md:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, tags, description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-muted/20 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <Select
            options={[
              { value: "all", label: "All Types" },
              { value: "url", label: "Website URL" },
              { value: "text", label: "Plain Text" },
              { value: "wifi", label: "WiFi QR" },
              { value: "contact", label: "vCard Card" },
              { value: "location", label: "Location Map" },
              { value: "event", label: "Calendar Event" },
              { value: "pdf", label: "PDF File" },
              { value: "image", label: "Image Gallery" },
            ]}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          />

          {/* Collection Selector */}
          <Select
            options={[
              { value: "all", label: "All Collections" },
              { value: "uncategorized", label: "Uncategorized" },
              ...collections.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
          />
        </div>

        {/* Second row filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/50">
          <div className="flex flex-wrap items-center gap-4">
            {/* Favorites Toggle */}
            <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-primary rounded cursor-pointer"
                checked={onlyFavorites}
                onChange={(e) => setOnlyFavorites(e.target.checked)}
              />
              <span>Only Starred/Favorites</span>
            </label>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none font-bold text-foreground focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title (A-Z)</option>
                <option value="downloads">Most Downloaded</option>
              </select>
            </div>
          </div>

          {/* View toggle Grid vs List */}
          <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md cursor-pointer ${
                viewMode === "grid" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md cursor-pointer ${
                viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Multi-select Header actions */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center p-3 bg-primary/10 border border-primary/20 rounded-xl"
        >
          <span className="text-xs font-bold text-primary">
            {selectedIds.length} items selected
          </span>
          <div className="flex items-center gap-2">
            {/* Move to folder */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={() => setIsBulkMoveOpen(!isBulkMoveOpen)}
                leftIcon={<FolderInput className="w-3.5 h-3.5" />}
              >
                Move Folder
              </Button>
              {isBulkMoveOpen && (
                <div className="absolute right-0 bottom-10 z-20 w-44 bg-card border border-border shadow-xl rounded-xl p-1.5 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1 select-none">
                    Select Collection
                  </div>
                  <button
                    onClick={() => handleBulkMove(undefined)}
                    className="w-full text-left text-xs hover:bg-secondary p-2 rounded-lg text-foreground font-semibold"
                  >
                    Uncategorized
                  </button>
                  {collections.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => handleBulkMove(col.id)}
                      className="w-full text-left text-xs hover:bg-secondary p-2 rounded-lg text-foreground font-semibold"
                    >
                      {col.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bulk delete */}
            <Button
              variant="destructive"
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={handleBulkDelete}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete
            </Button>
          </div>
        </motion.div>
      )}

      {/* Main Results Grid / List */}
      {filteredQrs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-2xl bg-card/25">
          <Layers className="w-12 h-12 opacity-20 text-muted-foreground mb-3" />
          <h3 className="font-bold text-sm text-foreground">No codes found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
            Try relaxing your filters or create a new QR code in the Creator tab.
          </p>
          <Link href="/generate" className="mt-4">
            <Button size="sm">Create QR Code</Button>
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredQrs.map((qr) => (
            <motion.div
              layout
              key={qr.id}
              className="bg-card rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between group"
            >
              {/* Checkbox select */}
              <input
                type="checkbox"
                className="absolute top-4 left-4 w-4 h-4 accent-primary z-10 opacity-0 group-hover:opacity-100 checked:opacity-100 transition-opacity cursor-pointer"
                checked={selectedIds.includes(qr.id)}
                onChange={() => toggleSelectId(qr.id)}
              />

              {/* Card top details */}
              <div className="space-y-3.5">
                {/* Type Badge & Favorite */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full select-none ml-6 group-hover:ml-6 transition-all duration-300">
                    <QrTypeIcon type={qr.type} className="w-3 h-3" />
                    <span>{qr.type}</span>
                  </span>
                  <button
                    onClick={() => toggleFavorite(qr.id)}
                    className={`p-1.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer ${
                      qr.favorite ? "text-amber-500" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Star className="w-4.5 h-4.5 fill-current" />
                  </button>
                </div>

                {/* Title */}
                <div>
                  <h4 className="font-bold text-sm text-foreground truncate">{qr.title}</h4>
                  {qr.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{qr.description}</p>
                  )}
                </div>

                {/* Tags */}
                {qr.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {qr.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-bold bg-secondary text-muted-foreground px-1.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {qr.tags.length > 3 && (
                      <span className="text-[9px] font-bold text-muted-foreground px-1 py-0.5">
                        +{qr.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Card Actions */}
              <div className="border-t border-border mt-4 pt-3 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(qr.createdAt).toLocaleDateString()}</span>
                </span>

                <div className="flex items-center gap-1">
                  {/* Preview Large */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                    onClick={() => setPreviewItem(qr)}
                    title="Fullscreen Preview"
                  >
                    <ExternalLink className="w-4.5 h-4.5" />
                  </Button>

                  {/* Edit metadata */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                    onClick={() => setEditItem(qr)}
                    title="Edit Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>

                  {/* Download PNG */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                    onClick={() => handleDownloadInHistory(qr)}
                    title="Download PNG"
                  >
                    <Download className="w-4 h-4" />
                  </Button>

                  {/* Delete Item */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-rose-600 rounded-lg"
                    onClick={() => setDeleteConfirmId(qr.id)}
                    title="Delete Code"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm divide-y divide-border">
          {filteredQrs.map((qr) => (
            <div
              key={qr.id}
              className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <input
                  type="checkbox"
                  className="w-4.5 h-4.5 accent-primary rounded cursor-pointer"
                  checked={selectedIds.includes(qr.id)}
                  onChange={() => toggleSelectId(qr.id)}
                />
                <div className="p-2.5 rounded-xl bg-secondary text-primary hidden sm:block">
                  <QrTypeIcon type={qr.type} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-foreground truncate">{qr.title}</h4>
                    <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full uppercase">
                      {qr.type}
                    </span>
                  </div>
                  {qr.description && (
                    <p className="text-xs text-muted-foreground truncate">{qr.description}</p>
                  )}
                </div>
              </div>

              {/* Right side actions */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground hidden md:inline">
                  Downloads: {qr.downloadsCount}
                </span>
                <button
                  onClick={() => toggleFavorite(qr.id)}
                  className={`p-1.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer ${
                    qr.favorite ? "text-amber-500" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Star className="w-4.5 h-4.5 fill-current" />
                </button>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-8 rounded-lg" onClick={() => setPreviewItem(qr)}>
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 rounded-lg" onClick={() => setEditItem(qr)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                    onClick={() => setDeleteConfirmId(qr.id)}
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- PREVIEW MODAL --- */}
      <Dialog isOpen={!!previewItem} onClose={() => setPreviewItem(null)} title="Inspect QR Code" size="md">
        {previewItem && (
          <div className="flex flex-col items-center text-center space-y-5">
            {/* Visual Render */}
            <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-md w-fit max-w-[280px]">
              <canvas ref={previewCanvasRef} className="w-[200px] h-[200px]" />
            </div>

            {/* Metadata information */}
            <div className="w-full text-left bg-secondary/30 border border-border p-4.5 rounded-xl space-y-3">
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Title</h4>
                <p className="text-sm font-semibold text-foreground mt-0.5">{previewItem.title}</p>
              </div>
              {previewItem.description && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</h4>
                  <p className="text-xs text-foreground/80 mt-0.5">{previewItem.description}</p>
                </div>
              )}
              {previewItem.notes && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notes</h4>
                  <p className="text-xs text-foreground/80 mt-0.5 italic">{previewItem.notes}</p>
                </div>
              )}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Encoded Value</h4>
                <div className="flex items-center justify-between gap-3 mt-1 p-2 bg-secondary/80 rounded-lg border border-border overflow-hidden">
                  <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[260px]">
                    {previewItem.content}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(previewItem.content);
                      toast("Copied content value", "success");
                    }}
                    className="p-1 rounded bg-card hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="w-full grid grid-cols-2 gap-3 pt-2">
              <Button onClick={() => handleDownloadInHistory(previewItem)} leftIcon={<Download className="w-4 h-4" />}>
                Download PNG
              </Button>
              {previewItem.content.startsWith("http") && (
                <a href={previewItem.content} target="_blank" rel="noreferrer" className="w-full">
                  <Button variant="outline" className="w-full" leftIcon={<ExternalLink className="w-4 h-4" />}>
                    Open Link
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* --- EDIT METADATA MODAL --- */}
      <Dialog
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title="Edit QR Code details"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setEditItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>Save Changes</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
          <Input label="Short Description" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
          <Textarea label="Personal Notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} />
          <Input label="Tags (comma-separated)" value={editTags} onChange={(e) => setEditTags(e.target.value)} />
        </div>
      </Dialog>

      {/* --- DELETE CONFIRM MODAL --- */}
      <Dialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Deletion"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (deleteConfirmId) {
                  await deleteQrCode(deleteConfirmId);
                  setDeleteConfirmId(null);
                  toast("QR Deleted", "success");
                }
              }}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground/80 leading-relaxed">
          Are you sure you want to permanently delete this QR Code? Files stored in IndexedDB associated with this code will be destroyed. This operation cannot be undone.
        </p>
      </Dialog>

       {/* --- DATABASE IMPORT MODAL --- */}
      <Dialog
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Restore Vault Database"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setImportOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4 flex flex-col items-center justify-center py-6 text-center">
          <div className="border-2 border-dashed border-border p-6 rounded-2xl w-full max-w-[320px] bg-secondary/10 flex flex-col items-center justify-center cursor-pointer relative hover:border-primary/50 transition-colors">
            <input
              type="file"
              ref={importFileRef}
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept=".json"
              onChange={handleImportJsonChange}
            />
            <Upload className="w-8 h-8 text-primary mb-3" />
            <span className="text-xs font-semibold text-foreground">Select Backup JSON</span>
            <p className="text-[10px] text-muted-foreground mt-1">
              Merges with your current local storage database.
            </p>
          </div>
          <p className="text-xs text-muted-foreground max-w-[280px]">
            Restoring your database will merge imported QR codes, folders/collections, and IndexedDB files with your existing data.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
