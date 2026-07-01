"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FileText, ArrowLeft, Download, ShieldAlert, Eye, FileSpreadsheet } from "lucide-react";
import { useQrVault } from "../../context/QrVaultContext";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";

export default function ViewerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { qrList, getFileData } = useQrVault();
  const { toast } = useToast();

  const id = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [qrItem, setQrItem] = useState<any>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const item = qrList.find((qr) => qr.id === id);
    if (!item) {
      setLoading(false);
      return;
    }

    setQrItem(item);

    // Fetch actual file from IndexedDB
    const loadFile = async () => {
      try {
        const content = await getFileData(id);
        setFileContent(content);
      } catch (e) {
        console.error("Failed to load file contents:", e);
        toast("File load error", "error", "Could not fetch document from local database.");
      } finally {
        setLoading(false);
      }
    };

    loadFile();
  }, [id, qrList, getFileData]);

  const handleDownload = () => {
    if (!fileContent || !qrItem?.fileData) return;
    const a = document.createElement("a");
    a.href = fileContent;
    a.download = qrItem.fileData.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast("Download started", "success");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs text-muted-foreground">Reading encrypted document storage...</span>
      </div>
    );
  }

  if (!qrItem || !qrItem.fileData) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <div>
          <h2 className="font-extrabold text-foreground tracking-tight text-base">Document Not Found</h2>
          <p className="text-xs text-muted-foreground mt-1">
            This QR code resolves to a document stored offline in this browser. The document was either deleted, or you are opening this link on a different browser/device.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/")} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  const { fileData } = qrItem;
  const isPdf = fileData.type === "application/pdf";
  const isImage = fileData.type.startsWith("image/");

  return (
    <div className="space-y-6 max-w-4xl mx-auto select-none">
      {/* Top action header */}
      <div className="flex justify-between items-center border-b border-border pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.push("/history")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-base font-bold text-foreground truncate max-w-[200px] sm:max-w-[400px]">
              {fileData.name}
            </h1>
            <p className="text-[10px] text-muted-foreground capitalize">
              {fileData.type} &bull; {(fileData.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleDownload} leftIcon={<Download className="w-4 h-4" />}>
          Download File
        </Button>
      </div>

      {/* Render Document */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden p-3 md:p-6 shadow-sm flex items-center justify-center min-h-[400px]">
        {fileContent ? (
          isPdf ? (
            <iframe
              src={fileContent}
              title="PDF Preview"
              className="w-full h-[600px] rounded-xl border border-border/50"
            />
          ) : isImage ? (
            <img
              src={fileContent}
              alt="Uploaded Visual File"
              className="max-w-full max-h-[600px] object-contain rounded-xl shadow-sm"
            />
          ) : (
            <div className="text-center py-10 space-y-4">
              <FileSpreadsheet className="w-16 h-16 text-primary mx-auto opacity-30" />
              <div>
                <h3 className="font-bold text-sm text-foreground">Document Format Preview Restricted</h3>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-[260px] mx-auto">
                  Previews are only supported for PDFs and image types. Click download to access this document.
                </p>
              </div>
              <Button size="sm" onClick={handleDownload} leftIcon={<Download className="w-4 h-4" />}>
                Download Document
              </Button>
            </div>
          )
        ) : (
          <div className="text-center py-12 text-muted-foreground text-xs">
            <Eye className="w-8 h-8 opacity-20 mx-auto mb-2" />
            <span>Document load failed or empty</span>
          </div>
        )}
      </div>
    </div>
  );
}
