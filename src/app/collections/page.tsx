"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  Plus,
  Trash2,
  ChevronRight,
  FolderOpen,
  ArrowLeft,
  Calendar,
  Layers,
  Star,
  ExternalLink,
} from "lucide-react";

import { useQrVault } from "../../context/QrVaultContext";
import { useToast } from "../../components/ui/Toast";
import { Button } from "../../components/ui/Button";
import { Input, Label } from "../../components/ui/Input";
import { Dialog } from "../../components/ui/Dialog";
import { Collection, QrCodeItem } from "../../types";
import { QrTypeIcon } from "../page";

export default function CollectionsPage() {
  const {
    collections,
    qrList,
    addCollection,
    deleteCollection,
    moveQrCode,
  } = useQrVault();

  const { toast } = useToast();

  // --- STATE ---
  const [selectedCol, setSelectedCol] = useState<Collection | null>(null);
  const [isNewColOpen, setIsNewColOpen] = useState(false);
  const [colName, setColName] = useState("");
  const [colDesc, setColDesc] = useState("");

  const [deleteConfirmCol, setDeleteConfirmCol] = useState<Collection | null>(null);
  const [deleteContents, setDeleteContents] = useState(false);

  // --- HANDLERS ---
  const handleCreateCollection = () => {
    if (!colName.trim()) {
      toast("Name required", "error", "Please write a folder name.");
      return;
    }
    addCollection(colName.trim(), colDesc.trim());
    setColName("");
    setColDesc("");
    setIsNewColOpen(false);
    toast("Collection Created", "success", "Your new virtual folder is ready.");
  };

  const handleDeleteSubmit = async () => {
    if (!deleteConfirmCol) return;
    await deleteCollection(deleteConfirmCol.id, deleteContents);
    setDeleteConfirmCol(null);
    setDeleteContents(false);
    // If deleted collection was selected, go back
    if (selectedCol?.id === deleteConfirmCol.id) {
      setSelectedCol(null);
    }
    toast("Folder Deleted", "success");
  };

  // Get count of items in a folder
  const getItemCount = (colId: string) => {
    return qrList.filter((qr) => qr.collectionId === colId).length;
  };

  // Get QRs in active selected collection
  const activeQrs = selectedCol
    ? qrList.filter((qr) => qr.collectionId === selectedCol.id)
    : [];

  return (
    <div className="space-y-6 select-none">
      <AnimatePresence mode="wait">
        {!selectedCol ? (
          /* LIST OF FOLDERS */
          <motion.div
            key="folders-list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-border pb-4">
              <div>
                <h1 className="text-xl font-bold text-foreground">My Folders</h1>
                <p className="text-xs text-muted-foreground">
                  Group your QR codes by context to stay organized
                </p>
              </div>
              <Button onClick={() => setIsNewColOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                New Folder
              </Button>
            </div>

            {/* Folders grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((col) => {
                const count = getItemCount(col.id);
                return (
                  <motion.div
                    key={col.id}
                    layoutId={`folder-card-${col.id}`}
                    onClick={() => setSelectedCol(col)}
                    className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group h-40"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                          <Folder className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full uppercase tracking-wider select-none">
                          {count} {count === 1 ? "item" : "items"}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-foreground tracking-tight group-hover:text-primary transition-colors">
                          {col.name}
                        </h3>
                        {col.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-[200px]">
                            {col.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-border/60 pt-3 flex items-center justify-between text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                      <span className="text-[10px] font-medium">
                        Opened {new Date(col.createdAt).toLocaleDateString()}
                      </span>
                      <ChevronRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* INSIDE A FOLDER */
          <motion.div
            key="folder-details"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Header / Back */}
            <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
              <div className="flex items-center gap-3.5">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedCol(null)}
                  className="rounded-lg h-9 w-9"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className="text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-primary" />
                    <span>{selectedCol.name}</span>
                  </h1>
                  {selectedCol.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedCol.description}</p>
                  )}
                </div>
              </div>

              {/* Folder options */}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteConfirmCol(selectedCol)}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Delete Folder
              </Button>
            </div>

            {/* Folder QR codes */}
            {activeQrs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-2xl bg-card/25">
                <Layers className="w-12 h-12 opacity-20 text-muted-foreground mb-3" />
                <h3 className="font-bold text-sm text-foreground">This folder is empty</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                  Drag and drop or edit QR metadata in History to place items in this collection.
                </p>
                <Button className="mt-4" size="sm" onClick={() => setSelectedCol(null)}>
                  Back to Folders
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {activeQrs.map((qr) => (
                  <div
                    key={qr.id}
                    className="bg-card rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between group"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full select-none">
                          <QrTypeIcon type={qr.type} className="w-3 h-3" />
                          <span>{qr.type}</span>
                        </span>
                        {qr.favorite && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground truncate">{qr.title}</h4>
                        {qr.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{qr.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-border mt-4 pt-3 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(qr.createdAt).toLocaleDateString()}</span>
                      </span>

                      {/* Quick un-categorize button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          moveQrCode(qr.id, undefined);
                          toast("Removed from folder", "success");
                        }}
                        className="text-xs h-7 px-2 font-semibold text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 rounded-lg"
                      >
                        Remove Folder
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CREATE COLLECTION MODAL --- */}
      <Dialog
        isOpen={isNewColOpen}
        onClose={() => setIsNewColOpen(false)}
        title="Create New Folder"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setIsNewColOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCollection}>Create</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Folder Name"
            placeholder="e.g. Invoices"
            value={colName}
            onChange={(e) => setColName(e.target.value)}
            required
          />
          <Input
            label="Short Description"
            placeholder="e.g. QR codes printed on physical receipt invoices"
            value={colDesc}
            onChange={(e) => setColDesc(e.target.value)}
          />
        </div>
      </Dialog>

      {/* --- DELETE COLLECTION MODAL --- */}
      <Dialog
        isOpen={!!deleteConfirmCol}
        onClose={() => setDeleteConfirmCol(null)}
        title="Confirm Folder Deletion"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirmCol(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubmit}>
              Confirm Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground/80 leading-relaxed">
            Are you sure you want to delete the folder <strong>{deleteConfirmCol?.name}</strong>?
          </p>
          <div className="p-3 bg-secondary/50 rounded-xl space-y-2 border border-border">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="keep-files"
                name="delete-action"
                className="w-4 h-4 accent-primary cursor-pointer"
                checked={!deleteContents}
                onChange={() => setDeleteContents(false)}
              />
              <label htmlFor="keep-files" className="text-xs font-semibold text-foreground cursor-pointer">
                Preserve QR codes (Make them Uncategorized)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="delete-files"
                name="delete-action"
                className="w-4 h-4 accent-primary cursor-pointer"
                checked={deleteContents}
                onChange={() => setDeleteContents(true)}
              />
              <label htmlFor="delete-files" className="text-xs font-semibold text-foreground cursor-pointer">
                Destroy all QR codes inside this folder
              </label>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
