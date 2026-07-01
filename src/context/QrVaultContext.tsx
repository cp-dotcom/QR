"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { format } from "date-fns";
import { QrCodeItem, Collection, QrSettings, AnalyticsSummary, QrType } from "../types";
import { saveFileInDb, getFileFromDb, deleteFileFromDb, clearFileDb } from "../utils/fileStorage";

interface QrVaultContextType {
  qrList: QrCodeItem[];
  collections: Collection[];
  settings: QrSettings;
  initialized: boolean;
  addQrCode: (qr: Omit<QrCodeItem, "id" | "createdAt" | "downloadsCount">, base64File?: string) => Promise<QrCodeItem>;
  updateQrCode: (id: string, updates: Partial<QrCodeItem>, base64File?: string) => Promise<void>;
  deleteQrCode: (id: string) => Promise<void>;
  duplicateQrCode: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => void;
  moveQrCode: (id: string, collectionId?: string) => void;
  addCollection: (name: string, description?: string) => void;
  deleteCollection: (id: string, deleteContents: boolean) => Promise<void>;
  updateSettings: (updates: Partial<QrSettings>) => void;
  recordDownload: (id: string) => void;
  exportData: () => Promise<string>;
  importData: (jsonString: string) => Promise<{ success: boolean; message: string }>;
  clearAllData: () => Promise<void>;
  analytics: AnalyticsSummary;
  getFileData: (id: string) => Promise<string>;
}

const QrVaultContext = createContext<QrVaultContextType | undefined>(undefined);

const DEFAULT_COLLECTIONS: Collection[] = [
  { id: "work", name: "Work", description: "Work-related documents and links", createdAt: new Date().toISOString() },
  { id: "college", name: "College", description: "Academic resources", createdAt: new Date().toISOString() },
  { id: "business", name: "Business", description: "Company links and contacts", createdAt: new Date().toISOString() },
  { id: "personal", name: "Personal", description: "Personal profiles and social links", createdAt: new Date().toISOString() },
  { id: "marketing", name: "Marketing", description: "Campaign codes and promotional links", createdAt: new Date().toISOString() },
];

const DEFAULT_SETTINGS: QrSettings = {
  theme: "system",
  accentColor: "indigo",
  autoSave: true,
  defaultSize: 400,
  defaultErrorCorrection: "H",
  defaultDotsColor: "#0f172a",
  defaultBgColor: "#ffffff",
  viewMode: "grid",
};

export const QrVaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [qrList, setQrList] = useState<QrCodeItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [settings, setSettings] = useState<QrSettings>(DEFAULT_SETTINGS);
  const [initialized, setInitialized] = useState(false);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedQrs = localStorage.getItem("qr_vault_qrs");
      const storedCollections = localStorage.getItem("qr_vault_collections");
      const storedSettings = localStorage.getItem("qr_vault_settings");

      if (storedQrs) setQrList(JSON.parse(storedQrs));
      
      if (storedCollections) {
        setCollections(JSON.parse(storedCollections));
      } else {
        setCollections(DEFAULT_COLLECTIONS);
        localStorage.setItem("qr_vault_collections", JSON.stringify(DEFAULT_COLLECTIONS));
      }

      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      } else {
        setSettings(DEFAULT_SETTINGS);
        localStorage.setItem("qr_vault_settings", JSON.stringify(DEFAULT_SETTINGS));
      }
    } catch (e) {
      console.error("Failed to parse LocalStorage data:", e);
    } finally {
      setInitialized(true);
    }
  }, []);

  // 2. Sync Settings, Themes and Accent colors to HTML DOM
  useEffect(() => {
    if (!initialized) return;

    const root = document.documentElement;
    
    // Manage theme
    const applyTheme = (theme: QrSettings["theme"]) => {
      const isDark =
        theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      
      root.classList.toggle("dark", isDark);
    };

    applyTheme(settings.theme);

    // Apply accent color
    root.setAttribute("data-accent", settings.accentColor);

    // If system theme is selected, watch for changes
    if (settings.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [settings.theme, settings.accentColor, initialized]);

  // Helper to save QR List to LocalStorage
  const saveQrs = (list: QrCodeItem[]) => {
    setQrList(list);
    localStorage.setItem("qr_vault_qrs", JSON.stringify(list));
  };

  // Helper to save Collections to LocalStorage
  const saveCollections = (list: Collection[]) => {
    setCollections(list);
    localStorage.setItem("qr_vault_collections", JSON.stringify(list));
  };

  // 3. CRUD actions
  const addQrCode = async (
    qr: Omit<QrCodeItem, "id" | "createdAt" | "downloadsCount">,
    base64File?: string
  ): Promise<QrCodeItem> => {
    const id = "qr_" + Math.random().toString(36).substring(2, 11);
    const newQr: QrCodeItem = {
      ...qr,
      id,
      createdAt: new Date().toISOString(),
      downloadsCount: 0,
    };

    if (base64File) {
      await saveFileInDb(id, base64File);
    }

    const updated = [newQr, ...qrList];
    saveQrs(updated);
    return newQr;
  };

  const updateQrCode = async (id: string, updates: Partial<QrCodeItem>, base64File?: string) => {
    const updated = qrList.map((qr) => {
      if (qr.id === id) {
        return { ...qr, ...updates };
      }
      return qr;
    });

    if (base64File) {
      await saveFileInDb(id, base64File);
    }

    saveQrs(updated);
  };

  const deleteQrCode = async (id: string) => {
    const updated = qrList.filter((qr) => qr.id !== id);
    saveQrs(updated);
    await deleteFileFromDb(id);
  };

  const duplicateQrCode = async (id: string) => {
    const target = qrList.find((qr) => qr.id === id);
    if (!target) return;

    const newId = "qr_" + Math.random().toString(36).substring(2, 11);
    const newQr: QrCodeItem = {
      ...target,
      id: newId,
      title: `${target.title} (Copy)`,
      createdAt: new Date().toISOString(),
      favorite: false,
      downloadsCount: 0,
    };

    // If has attachment, clone the file in IndexedDB
    if (target.fileData) {
      try {
        const fileContent = await getFileFromDb(target.id);
        if (fileContent) {
          await saveFileInDb(newId, fileContent);
        }
      } catch (e) {
        console.error("Failed to duplicate file in IndexedDB:", e);
      }
    }

    saveQrs([newQr, ...qrList]);
  };

  const toggleFavorite = (id: string) => {
    const updated = qrList.map((qr) => {
      if (qr.id === id) {
        return { ...qr, favorite: !qr.favorite };
      }
      return qr;
    });
    saveQrs(updated);
  };

  const moveQrCode = (id: string, collectionId?: string) => {
    const updated = qrList.map((qr) => {
      if (qr.id === id) {
        return { ...qr, collectionId };
      }
      return qr;
    });
    saveQrs(updated);
  };

  const addCollection = (name: string, description?: string) => {
    const id = "col_" + Math.random().toString(36).substring(2, 11);
    const newCol: Collection = {
      id,
      name,
      description,
      createdAt: new Date().toISOString(),
    };
    saveCollections([...collections, newCol]);
  };

  const deleteCollection = async (id: string, deleteContents: boolean) => {
    // Delete collection
    const updatedCols = collections.filter((c) => c.id !== id);
    saveCollections(updatedCols);

    if (deleteContents) {
      // Delete QRs in this collection along with IndexedDB files
      const qrsToDelete = qrList.filter((qr) => qr.collectionId === id);
      for (const qr of qrsToDelete) {
        await deleteFileFromDb(qr.id);
      }
      const updatedQrs = qrList.filter((qr) => qr.collectionId !== id);
      saveQrs(updatedQrs);
    } else {
      // Keep QRs, remove collection reference
      const updatedQrs = qrList.map((qr) => {
        if (qr.collectionId === id) {
          return { ...qr, collectionId: undefined };
        }
        return qr;
      });
      saveQrs(updatedQrs);
    }
  };

  const updateSettings = (updates: Partial<QrSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    localStorage.setItem("qr_vault_settings", JSON.stringify(newSettings));
  };

  const recordDownload = (id: string) => {
    const updated = qrList.map((qr) => {
      if (qr.id === id) {
        return { ...qr, downloadsCount: qr.downloadsCount + 1 };
      }
      return qr;
    });
    saveQrs(updated);
  };

  // Export Data: merges QR metadata and files from DB into one complete JSON package
  const exportData = async (): Promise<string> => {
    const packageItems = [];
    for (const qr of qrList) {
      let fileDataString = "";
      if (qr.fileData) {
        try {
          fileDataString = await getFileFromDb(qr.id);
        } catch (e) {
          console.error("Failed to load file for export:", e);
        }
      }
      packageItems.push({
        ...qr,
        exportedFile: fileDataString,
      });
    }

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      qrList: packageItems,
      collections,
    };

    return JSON.stringify(payload, null, 2);
  };

  // Import Data: parses JSON package and splits metadata to local storage and files to IndexedDB
  const importData = async (jsonString: string): Promise<{ success: boolean; message: string }> => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !Array.isArray(parsed.qrList)) {
        return { success: false, message: "Invalid backup format. Missing QR list." };
      }

      // Merge collections
      const importedCols: Collection[] = parsed.collections || [];
      const colMap = new Map(collections.map((c) => [c.id, c]));
      importedCols.forEach((c) => colMap.set(c.id, c));
      const newCollectionsList = Array.from(colMap.values());
      saveCollections(newCollectionsList);

      // Merge QR Codes and restore files in IndexedDB
      const importedQrs = parsed.qrList;
      const currentQrMap = new Map(qrList.map((qr) => [qr.id, qr]));

      for (const item of importedQrs) {
        const { exportedFile, ...qrData } = item;
        currentQrMap.set(qrData.id, qrData as QrCodeItem);

        if (qrData.fileData && exportedFile) {
          await saveFileInDb(qrData.id, exportedFile);
        }
      }

      const newQrList = Array.from(currentQrMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      saveQrs(newQrList);

      return { success: true, message: `Successfully imported data.` };
    } catch (e) {
      console.error(e);
      return { success: false, message: "Failed to parse imported data. Ensure file is valid JSON." };
    }
  };

  const clearAllData = async () => {
    localStorage.removeItem("qr_vault_qrs");
    localStorage.removeItem("qr_vault_collections");
    localStorage.removeItem("qr_vault_settings");
    setQrList([]);
    setCollections(DEFAULT_COLLECTIONS);
    setSettings(DEFAULT_SETTINGS);
    await clearFileDb();
  };

  const getFileData = async (id: string): Promise<string> => {
    return await getFileFromDb(id);
  };

  // 4. Analytics Calculations
  const totalCount = qrList.length;
  const favoritesCount = qrList.filter((qr) => qr.favorite).length;
  const totalDownloads = qrList.reduce((acc, curr) => acc + curr.downloadsCount, 0);

  const typeDistribution = qrList.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {} as Record<QrType, number>);

  // Compute dummy storage usage estimate (rough estimate in bytes)
  const metaBytes = typeof window !== "undefined" ? JSON.stringify(qrList).length : 0;
  // We approximate attachments file size by reading from metadata
  const fileBytes = qrList.reduce((acc, curr) => acc + (curr.fileData?.size || 0), 0);
  const storageUsedBytes = metaBytes + fileBytes;

  // Compute stats of QRs created in the last 7 days
  const historyByDay = Array.from({ length: 7 }).map((_, idx) => {
    const date = new Date();
    date.setDate(date.getDate() - idx);
    const dayLabel = format(date, "EEE"); // e.g. Mon, Tue
    const dayIso = format(date, "yyyy-MM-dd");

    const count = qrList.filter((qr) => {
      const qrDate = qr.createdAt.split("T")[0];
      return qrDate === dayIso;
    }).length;

    return { day: dayLabel, count };
  }).reverse();

  const analytics: AnalyticsSummary = {
    totalCount,
    typeDistribution,
    favoritesCount,
    totalDownloads,
    historyByDay,
    storageUsedBytes,
  };

  return (
    <QrVaultContext.Provider
      value={{
        qrList,
        collections,
        settings,
        initialized,
        addQrCode,
        updateQrCode,
        deleteQrCode,
        duplicateQrCode,
        toggleFavorite,
        moveQrCode,
        addCollection,
        deleteCollection,
        updateSettings,
        recordDownload,
        exportData,
        importData,
        clearAllData,
        analytics,
        getFileData,
      }}
    >
      {children}
    </QrVaultContext.Provider>
  );
};

export const useQrVault = () => {
  const context = useContext(QrVaultContext);
  if (!context) {
    throw new Error("useQrVault must be used within a QrVaultProvider");
  }
  return context;
};
