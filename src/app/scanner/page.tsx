"use client";

import React, { useState, useEffect, useRef } from "react";
import { Camera, Scan, Upload, Copy, ExternalLink, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "../../components/ui/Toast";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";

export default function ScannerPage() {
  const { toast } = useToast();

  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scannerInstance, setScannerInstance] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");

  const scannerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- INITIALIZE CAMERA SCANNER ---
  useEffect(() => {
    if (activeTab !== "camera" || typeof window === "undefined") return;

    let scanner: any = null;

    const startScanner = async () => {
      try {
        // Dynamic import to prevent SSR crashes (html5-qrcode requires window/document)
        const { Html5QrcodeScanner } = await import("html5-qrcode");

        scanner = new Html5QrcodeScanner(
          "reader",
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            },
            aspectRatio: 1.0,
          },
          false
        );

        scanner.render(
          (decodedText: string) => {
            // Success
            setScanResult(decodedText);
            toast("QR Scanned successfully!", "success");
            // Beep audio (simulated or optional context play)
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
              gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.1);
            } catch (e) {}
          },
          (errorMessage: string) => {
            // Failure logging is throttled by html5-qrcode
          }
        );

        setScannerInstance(scanner);
        setErrorMsg(null);
      } catch (err: any) {
        console.error("Camera access error:", err);
        setErrorMsg("Failed to access camera. Please ensure permissions are granted and camera is not in use.");
      }
    };

    startScanner();

    return () => {
      if (scanner) {
        scanner
          .clear()
          .catch((e: any) => console.log("Failed to clear scanner during unmount:", e));
      }
    };
  }, [activeTab]);

  // --- SCAN FROM FILE ---
  const handleFileUploadScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      
      // Temporary div to avoid conflict
      const tempId = "temp-file-reader";
      const div = document.createElement("div");
      div.id = tempId;
      div.style.display = "none";
      document.body.appendChild(div);

      const html5QrCode = new Html5Qrcode(tempId);
      
      html5QrCode
        .scanFile(file, true)
        .then((decodedText) => {
          setScanResult(decodedText);
          toast("QR Decoded from image!", "success");
          document.body.removeChild(div);
        })
        .catch((err) => {
          console.error(err);
          toast("No QR Code found", "error", "Make sure the image has a clear, well-lit QR code.");
          document.body.removeChild(div);
        });
    } catch (e) {
      console.error(e);
      toast("Decoder failure", "error");
    }
  };

  // --- RESULT ACTIONS ---
  const handleCopyResult = () => {
    if (!scanResult) return;
    navigator.clipboard.writeText(scanResult);
    toast("Copied to clipboard", "success");
  };

  const getResultType = (content: string) => {
    if (content.startsWith("http://") || content.startsWith("https://")) return "url";
    if (content.startsWith("mailto:")) return "email";
    if (content.startsWith("tel:")) return "phone";
    if (content.startsWith("SMSTO:")) return "sms";
    if (content.startsWith("WIFI:")) return "wifi";
    return "text";
  };

  const type = scanResult ? getResultType(scanResult) : "text";

  const renderActionButtons = () => {
    if (!scanResult) return null;

    if (type === "url") {
      return (
        <a href={scanResult} target="_blank" rel="noreferrer" className="w-full">
          <Button className="w-full" leftIcon={<ExternalLink className="w-4 h-4" />}>
            Open Website
          </Button>
        </a>
      );
    }
    if (type === "email") {
      return (
        <a href={scanResult} className="w-full">
          <Button className="w-full" leftIcon={<ExternalLink className="w-4 h-4" />}>
            Compose Email
          </Button>
        </a>
      );
    }
    if (type === "phone") {
      return (
        <a href={scanResult} className="w-full">
          <Button className="w-full" leftIcon={<ExternalLink className="w-4 h-4" />}>
            Dial Phone
          </Button>
        </a>
      );
    }
    if (type === "sms") {
      // Parse SMSTO:phone:body
      const parts = scanResult.split(":");
      const phone = parts[1] || "";
      const body = parts.slice(2).join(":") || "";
      return (
        <a href={`sms:${phone}?body=${encodeURIComponent(body)}`} className="w-full">
          <Button className="w-full">Send SMS</Button>
        </a>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto select-none">
      {/* Header */}
      <div className="border-b border-border pb-4 text-center">
        <h1 className="text-xl font-bold text-foreground">QR Scanner</h1>
        <p className="text-xs text-muted-foreground">Scan physical QR codes using your device camera or files</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-secondary p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("camera")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "camera" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          <Camera className="w-4 h-4" />
          Camera Feed
        </button>
        <button
          onClick={() => {
            setActiveTab("upload");
            setErrorMsg(null);
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "upload" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload Image
        </button>
      </div>

      {/* Camera feed area */}
      {activeTab === "camera" && (
        <div className="flex flex-col items-center justify-center">
          {errorMsg ? (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-6 rounded-2xl text-center space-y-3 w-full">
              <AlertCircle className="w-10 h-10 mx-auto" />
              <p className="text-xs font-semibold leading-relaxed">{errorMsg}</p>
              <Button
                variant="outline"
                size="sm"
                className="mx-auto"
                leftIcon={<RefreshCw className="w-4 h-4" />}
                onClick={() => {
                  setErrorMsg(null);
                  setActiveTab("upload");
                  setTimeout(() => setActiveTab("camera"), 100);
                }}
              >
                Retry Camera Connection
              </Button>
            </div>
          ) : (
            <div className="relative w-full max-w-sm aspect-square bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
              <div id="reader" className="w-full h-full" ref={scannerRef} />
              
              {/* Floating laser line scan simulation overlay */}
              <div className="absolute inset-x-8 top-1/2 h-0.5 bg-primary/80 shadow-[0_0_8px_var(--primary)] animate-bounce pointer-events-none" />
            </div>
          )}
        </div>
      )}

      {/* Upload scanning area */}
      {activeTab === "upload" && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer bg-secondary/15 h-64"
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUploadScan}
          />
          <Scan className="w-12 h-12 text-primary mb-3.5 animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground">Click to select image file</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
            JPG, PNG, JPEG or WEBP files containing a QR code
          </p>
        </div>
      )}

      {/* --- RESULTS DIALOG --- */}
      <Dialog isOpen={!!scanResult} onClose={() => setScanResult(null)} title="QR Scanner Result">
        {scanResult && (
          <div className="space-y-5 flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
            <div className="w-full text-center">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Decoded Type: {type.toUpperCase()}
              </h3>
            </div>

            <div className="w-full bg-secondary/40 border border-border p-4.5 rounded-xl text-left select-text">
              <p className="text-sm font-mono break-all text-foreground leading-relaxed">
                {scanResult}
              </p>
            </div>

            <div className="w-full grid grid-cols-2 gap-3 pt-2">
              <Button variant="outline" className="w-full" onClick={handleCopyResult} leftIcon={<Copy className="w-4 h-4" />}>
                Copy Value
              </Button>
              {renderActionButtons() || (
                <Button variant="secondary" className="w-full" onClick={() => setScanResult(null)}>
                  Close
                </Button>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
