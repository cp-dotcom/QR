export type QrType =
  | "url"
  | "text"
  | "wifi"
  | "contact"
  | "location"
  | "event"
  | "email"
  | "sms"
  | "phone"
  | "pdf"
  | "image"
  | "doc";

export interface QrGradient {
  type: "linear" | "radial";
  color1: string;
  color2: string;
  angle: number;
}

export interface QrStylingOptions {
  size: number;
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
  dotsColor: string;
  dotsType: "square" | "rounded" | "dots";
  backgroundColor: string;
  gradient?: QrGradient;
  logo?: string; // base64 encoded logo image
  logoSize?: number; // scale percentage (0.05 to 0.3)
  logoMargin?: number; // size of clear area around logo
}

export interface FileData {
  name: string;
  type: string;
  size: number;
  data: string; // base64 data string
}

export interface QrCodeItem {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  type: QrType;
  content: string; // The encoded text
  createdAt: string;
  favorite: boolean;
  collectionId?: string; // If placed inside a folder
  tags: string[];
  styling: QrStylingOptions;
  fileData?: FileData; // Offline stored base64 file data for image, pdf, doc
  downloadsCount: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface QrSettings {
  theme: "light" | "dark" | "system";
  accentColor: "violet" | "indigo" | "emerald" | "amber" | "rose" | "sky";
  autoSave: boolean;
  defaultSize: number;
  defaultErrorCorrection: "L" | "M" | "Q" | "H";
  defaultDotsColor: string;
  defaultBgColor: string;
  viewMode: "grid" | "list";
}

export interface BulkItem {
  id: string;
  title: string;
  content: string;
}

export interface AnalyticsSummary {
  totalCount: number;
  typeDistribution: Record<QrType, number>;
  favoritesCount: number;
  totalDownloads: number;
  historyByDay: { day: string; count: number }[];
  storageUsedBytes: number;
}
