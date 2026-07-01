"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import JSZip from "jszip";
import {
  QrCode,
  Link2,
  FileText,
  Image as ImageIcon,
  Wifi,
  User,
  MapPin,
  Calendar,
  Mail,
  MessageSquare,
  Phone,
  Upload,
  Sparkles,
  Download,
  Copy,
  Printer,
  Undo2,
  Sliders,
  Palette,
  Image as LogoIcon,
  HelpCircle,
  AlertTriangle,
  Layers,
} from "lucide-react";

import { useQrVault } from "../../context/QrVaultContext";
import { useToast } from "../../components/ui/Toast";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { QrType, QrStylingOptions, FileData } from "../../types";
import { drawQrOnCanvas, drawQrToSvgString } from "../../utils/qrDrawer";
import {
  encodeWifi,
  encodeVCard,
  encodeEmail,
  encodeSms,
  encodeLocation,
  encodeEvent,
} from "../../utils/encoders";

const TYPES_GRID: { type: QrType; label: string; icon: React.ComponentType<any> }[] = [
  { type: "url", label: "Website", icon: Link2 },
  { type: "text", label: "Plain Text", icon: FileText },
  { type: "wifi", label: "WiFi Code", icon: Wifi },
  { type: "contact", label: "vCard Contact", icon: User },
  { type: "location", label: "Location Map", icon: MapPin },
  { type: "event", label: "Calendar Event", icon: Calendar },
  { type: "email", label: "Email Link", icon: Mail },
  { type: "sms", label: "SMS Send", icon: MessageSquare },
  { type: "phone", label: "Phone Dial", icon: Phone },
  { type: "pdf", label: "PDF File", icon: FileText },
  { type: "image", label: "Image Gallery", icon: ImageIcon },
  { type: "doc", label: "Word Doc", icon: FileText },
];

export default function GeneratePage() {
  const { settings, addQrCode } = useQrVault();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [activeType, setActiveType] = useState<QrType>("url");

  // --- STYLING OPTIONS STATE ---
  const [styling, setStyling] = useState<QrStylingOptions>({
    size: 400,
    errorCorrectionLevel: "H",
    dotsColor: "#0f172a",
    dotsType: "square",
    backgroundColor: "#ffffff",
    logoSize: 0.18,
    logoMargin: 6,
  });

  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [gradient, setGradient] = useState({
    type: "linear" as "linear" | "radial",
    color1: "#6366f1",
    color2: "#4f46e5",
    angle: 135,
  });

  const [logoFile, setLogoFile] = useState<string>("");

  // --- FORM FIELDS STATE ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const [url, setUrl] = useState("https://");
  const [text, setText] = useState("");
  const [wifi, setWifi] = useState({ ssid: "", password: "", encryption: "WPA" as "WPA" | "WEP" | "nopass", hidden: false });
  const [contact, setContact] = useState({ name: "", phone: "", email: "", company: "", website: "" });
  const [location, setLocation] = useState({ latitude: "", longitude: "" });
  const [event, setEvent] = useState({ title: "", location: "", startDate: "", startTime: "10:00", endDate: "", endTime: "18:00", description: "" });
  const [email, setEmail] = useState({ email: "", subject: "", message: "" });
  const [sms, setSms] = useState({ phone: "", message: "" });
  const [phoneNumber, setPhoneNumber] = useState("");

  // File states (Base64 uploads)
  const [attachedFile, setAttachedFile] = useState<FileData | null>(null);

  // Bulk Generator State
  const [bulkInput, setBulkInput] = useState("");
  const [bulkType, setBulkType] = useState<"url" | "text">("url");
  const [bulkTitlePrefix, setBulkTitlePrefix] = useState("Bulk Code");

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize styling defaults from settings context
  useEffect(() => {
    if (settings) {
      setStyling({
        size: settings.defaultSize,
        errorCorrectionLevel: settings.defaultErrorCorrection,
        dotsColor: settings.defaultDotsColor,
        dotsType: "square",
        backgroundColor: settings.defaultBgColor,
        logoSize: 0.18,
        logoMargin: 6,
      });
    }
  }, [settings]);

  // --- COMPUTE ENCODED VALUE ---
  const getEncodedValue = (qrIdPlaceholder = "temp_id"): string => {
    switch (activeType) {
      case "url":
        return url;
      case "text":
        return text;
      case "wifi":
        return encodeWifi(wifi);
      case "contact":
        return encodeVCard(contact);
      case "location":
        return encodeLocation(location);
      case "event":
        return encodeEvent(event);
      case "email":
        return encodeEmail(email);
      case "sms":
        return encodeSms(sms);
      case "phone":
        return phoneNumber ? `tel:${phoneNumber}` : "";
      case "pdf":
      case "image":
      case "doc":
        // Client Viewer URL
        if (typeof window !== "undefined") {
          return `${window.location.origin}/viewer?id=${qrIdPlaceholder}`;
        }
        return `https://qrvault.local/viewer?id=${qrIdPlaceholder}`;
      default:
        return "";
    }
  };

  // --- LIVE CANVAS RENDER ---
  const encodedContent = getEncodedValue();
  const stylingOptions: QrStylingOptions = {
    ...styling,
    gradient: gradientEnabled ? gradient : undefined,
    logo: logoFile || undefined,
  };

  useEffect(() => {
    if (!canvasRef.current || !encodedContent) return;

    const render = async () => {
      try {
        await drawQrOnCanvas(canvasRef.current!, encodedContent, stylingOptions);
      } catch (err) {
        console.error("Canvas draw failure:", err);
      }
    };

    // Debounce/run render
    const timer = setTimeout(render, 50);
    return () => clearTimeout(timer);
  }, [encodedContent, styling, gradientEnabled, gradient, logoFile]);

  // --- FILE LOADERS ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: "pdf" | "image" | "doc") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show warnings/limits
    if (file.size > 2 * 1024 * 1024) {
      toast("File size too large", "warning", "Files are limited to 2MB to ensure smooth local database performance.", 4000);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result as string, // base64 representation
      });
      setTitle(file.name.split(".")[0]);
      toast("File attached successfully", "success", `${file.name} is ready for encoding.`);
    };
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setLogoFile(reader.result as string);
      toast("Logo imported", "success", "Branded logo added to your QR options.");
    };
  };

  // --- DETECT GEOLOCATION ---
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude.toString(),
            longitude: pos.coords.longitude.toString(),
          });
          toast("Location acquired", "success");
        },
        () => {
          toast("Access denied", "error", "Could not request browser location permissions.");
        }
      );
    } else {
      toast("Not supported", "warning", "Browser does not support geolocation.");
    }
  };

  // --- SUBMIT / SAVE ACTION ---
  const handleSaveQr = async () => {
    if (!encodedContent) {
      toast("Inputs required", "error", "Please fill in the details before generating.");
      return;
    }

    const qrTitle = title.trim() || `My QR (${activeType.toUpperCase()})`;
    const tagsArray = tagsInput
      ? tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    try {
      // Create code item
      const item = await addQrCode(
        {
          title: qrTitle,
          description: description.trim(),
          notes: notes.trim(),
          type: activeType,
          content: "", // Will be assigned inside addQrCode, or we pass getEncodedValue(newId)
          favorite: false,
          tags: tagsArray,
          styling: stylingOptions,
          fileData: attachedFile
            ? { name: attachedFile.name, type: attachedFile.type, size: attachedFile.size, data: "" } // store metadata only in list
            : undefined,
        },
        attachedFile?.data
      );

      // Re-draw with correct final ID in viewer URL if it is a file type
      if (["pdf", "image", "doc"].includes(activeType)) {
        const finalUrl = `${window.location.origin}/viewer?id=${item.id}`;
        await addQrCode; // We update the item with the correct final url
        // Wait, let's fix the content url for files:
        item.content = finalUrl;
        // In Context API we will make sure files save with correct URLs
      } else {
        item.content = encodedContent;
      }

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#6366f1", "#4f46e5", "#10b981", "#f59e0b"],
      });

      toast("QR Generated Successfully", "success", `'${qrTitle}' is saved to your Local History.`);
    } catch (e) {
      console.error(e);
      toast("Error creating QR", "error", "Something went wrong saving the code.");
    }
  };

  // --- ACTIONS ---
  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.trim() || "qr-code"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast("PNG Downloaded", "success");
  };

  const handleDownloadSvg = async () => {
    try {
      const svgStr = await drawQrToSvgString(encodedContent, stylingOptions);
      const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.trim() || "qr-code"}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast("SVG Downloaded", "success");
    } catch (e) {
      console.error(e);
      toast("SVG generation failed", "error");
    }
  };

  const handleCopyClipboard = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        toast("Copied to clipboard", "success", "QR Code image is copied. Paste it anywhere!");
      });
    } catch (e) {
      console.error(e);
      toast("Copy failed", "error", "Your browser might restrict clipboard image writes.");
    }
  };

  const handlePrint = () => {
    if (!canvasRef.current) return;
    const imgUrl = canvasRef.current.toDataURL("image/png");
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
          <h2>${title || "QR Code"}</h2>
          <img src="${imgUrl}" style="width: 300px; height: 300px;" />
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // --- BULK ZIP ACTION ---
  const handleBulkGenerateZip = async () => {
    const lines = bulkInput
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      toast("Input required", "error", "Please write some text lines or URLs in the bulk area.");
      return;
    }

    toast("Processing Bulk QR", "info", `Generating ${lines.length} codes. Please wait...`);

    const zip = new JSZip();

    try {
      for (let i = 0; i < lines.length; i++) {
        const content = lines[i];
        // Create canvas offscreen
        const offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = stylingOptions.size || 400;
        offscreenCanvas.height = stylingOptions.size || 400;

        await drawQrOnCanvas(offscreenCanvas, content, stylingOptions);
        
        // Convert to dataurl
        const dataUrl = offscreenCanvas.toDataURL("image/png");
        const base64Content = dataUrl.split(",")[1];

        const filename = `${bulkTitlePrefix.replace(/\s+/g, "_")}_${i + 1}.png`;
        zip.file(filename, base64Content, { base64: true });
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${bulkTitlePrefix.replace(/\s+/g, "_")}_codes.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      toast("ZIP Downloaded", "success", `Packaged ${lines.length} QR codes into the archive.`);
    } catch (e) {
      console.error(e);
      toast("Bulk generation failed", "error");
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* Top Toggle Mode tab */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Creator Workspace</h1>
          <p className="text-xs text-muted-foreground">Select between single or bulk creation modes</p>
        </div>
        <div className="flex bg-secondary p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("single")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === "single" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Single Generator
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === "bulk" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Bulk QR Generator
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "single" ? (
          <motion.div
            key="single"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Left: Input details (Col span 7) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Types Carousel */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="text-xs font-bold text-foreground mb-4 uppercase tracking-wider">
                  1. Content Type Selector
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {TYPES_GRID.map((item) => {
                    const isActive = activeType === item.type;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.type}
                        onClick={() => {
                          setActiveType(item.type);
                          setAttachedFile(null);
                          setTitle("");
                        }}
                        className={`flex flex-col items-center justify-center py-3.5 px-2 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "border-primary bg-primary/5 text-primary scale-[1.03] shadow-md shadow-primary/5"
                            : "border-border hover:border-muted-foreground/30 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="w-5 h-5 mb-1.5" />
                        <span className="text-[10px] font-bold tracking-tight leading-none whitespace-normal">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Forms Panel */}
              <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm space-y-5">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>2. Details for {activeType.toUpperCase()}</span>
                </h3>

                {/* Form Fields depending on ActiveType */}
                {activeType === "url" && (
                  <Input
                    label="Website URL"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                )}

                {activeType === "text" && (
                  <Textarea
                    label="Plain Text String"
                    placeholder="Enter text payload to embed in the QR code..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
                  />
                )}

                {activeType === "wifi" && (
                  <div className="space-y-4">
                    <Input
                      label="Network Name (SSID)"
                      placeholder="My Home WiFi"
                      value={wifi.ssid}
                      onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={wifi.password}
                        onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                        disabled={wifi.encryption === "nopass"}
                      />
                      <Select
                        label="Security Type"
                        options={[
                          { value: "WPA", label: "WPA/WPA2" },
                          { value: "WEP", label: "WEP" },
                          { value: "nopass", label: "Unsecured" },
                        ]}
                        value={wifi.encryption}
                        onChange={(e) => setWifi({ ...wifi, encryption: e.target.value as any })}
                      />
                    </div>
                  </div>
                )}

                {activeType === "contact" && (
                  <div className="space-y-4">
                    <Input
                      label="Full Name"
                      placeholder="John Doe"
                      value={contact.name}
                      onChange={(e) => setContact({ ...contact, name: e.target.value })}
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Phone Number"
                        placeholder="+1 (555) 019-2834"
                        value={contact.phone}
                        onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                      />
                      <Input
                        label="Email Address"
                        type="email"
                        placeholder="john@example.com"
                        value={contact.email}
                        onChange={(e) => setContact({ ...contact, email: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Company ORG"
                        placeholder="Acme Corp"
                        value={contact.company}
                        onChange={(e) => setContact({ ...contact, company: e.target.value })}
                      />
                      <Input
                        label="Website"
                        placeholder="https://acme.org"
                        value={contact.website}
                        onChange={(e) => setContact({ ...contact, website: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {activeType === "location" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Latitude"
                        placeholder="e.g. 37.7749"
                        value={location.latitude}
                        onChange={(e) => setLocation({ ...location, latitude: e.target.value })}
                        required
                      />
                      <Input
                        label="Longitude"
                        placeholder="e.g. -122.4194"
                        value={location.longitude}
                        onChange={(e) => setLocation({ ...location, longitude: e.target.value })}
                        required
                      />
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleGetLocation}
                      leftIcon={<MapPin className="w-4 h-4" />}
                    >
                      Acquire Browser Location
                    </Button>
                  </div>
                )}

                {activeType === "event" && (
                  <div className="space-y-4">
                    <Input
                      label="Event Title"
                      placeholder="Annual General Meeting"
                      value={event.title}
                      onChange={(e) => setEvent({ ...event, title: e.target.value })}
                      required
                    />
                    <Input
                      label="Location"
                      placeholder="Grand Ballroom, Plaza Hotel"
                      value={event.location}
                      onChange={(e) => setEvent({ ...event, location: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Start Date"
                        type="date"
                        value={event.startDate}
                        onChange={(e) => setEvent({ ...event, startDate: e.target.value })}
                        required
                      />
                      <Input
                        label="Start Time"
                        type="time"
                        value={event.startTime}
                        onChange={(e) => setEvent({ ...event, startTime: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="End Date"
                        type="date"
                        value={event.endDate}
                        onChange={(e) => setEvent({ ...event, endDate: e.target.value })}
                      />
                      <Input
                        label="End Time"
                        type="time"
                        value={event.endTime}
                        onChange={(e) => setEvent({ ...event, endTime: e.target.value })}
                      />
                    </div>
                    <Textarea
                      label="Event Description"
                      placeholder="Add brief details about the event schedule..."
                      value={event.description}
                      onChange={(e) => setEvent({ ...event, description: e.target.value })}
                    />
                  </div>
                )}

                {activeType === "email" && (
                  <div className="space-y-4">
                    <Input
                      label="Recipient Email"
                      type="email"
                      placeholder="support@qrvault.com"
                      value={email.email}
                      onChange={(e) => setEmail({ ...email, email: e.target.value })}
                      required
                    />
                    <Input
                      label="Subject"
                      placeholder="Feedback about QR Vault"
                      value={email.subject}
                      onChange={(e) => setEmail({ ...email, subject: e.target.value })}
                    />
                    <Textarea
                      label="Body Message"
                      placeholder="Write your email body content..."
                      value={email.message}
                      onChange={(e) => setEmail({ ...email, message: e.target.value })}
                    />
                  </div>
                )}

                {activeType === "sms" && (
                  <div className="space-y-4">
                    <Input
                      label="Phone Number"
                      placeholder="+15551234"
                      value={sms.phone}
                      onChange={(e) => setSms({ ...sms, phone: e.target.value })}
                      required
                    />
                    <Textarea
                      label="SMS Message Body"
                      placeholder="Type the pre-filled message text here..."
                      value={sms.message}
                      onChange={(e) => setSms({ ...sms, message: e.target.value })}
                    />
                  </div>
                )}

                {activeType === "phone" && (
                  <Input
                    label="Phone Number (Dial direct)"
                    placeholder="e.g. +15551234"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                )}

                {/* Upload File Fields (PDF, Image, Doc) */}
                {["pdf", "image", "doc"].includes(activeType) && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer relative bg-secondary/15">
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept={
                          activeType === "pdf"
                            ? ".pdf"
                            : activeType === "image"
                            ? ".jpg,.jpeg,.png,.webp"
                            : ".pdf,.doc,.docx,.txt"
                        }
                        onChange={(e) => handleFileChange(e, activeType as any)}
                      />
                      <Upload className="w-8 h-8 text-primary mb-3" />
                      <div className="text-xs font-semibold text-foreground">
                        {attachedFile ? (
                          <span className="text-primary">{attachedFile.name}</span>
                        ) : (
                          <span>Click or Drag to Upload File</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Max Size: 2MB. Stored locally in your browser.
                      </p>
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] font-medium text-amber-800 leading-normal dark:text-amber-300">
                        <strong>Storage Alert:</strong> File attachments are saved inside IndexedDB. Scanning this QR code links back to a viewer page hosted on this client. It will not work on different devices unless they import your backup file in Settings.
                      </p>
                    </div>
                  </div>
                )}

                {/* Shared Details: Title, Description, Notes */}
                <div className="border-t border-border pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="QR Title"
                    placeholder="Provide a search title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <Input
                    label="Tags (Comma separated)"
                    placeholder="invoice, college, personal"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Short Description"
                    placeholder="Used in dashboard summaries..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <Input
                    label="Personal Notes"
                    placeholder="Extra contextual notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Right: Customization & Preview (Col span 5) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Visual Preview */}
              <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm flex flex-col items-center">
                <h3 className="text-xs font-bold text-foreground mb-4 uppercase tracking-wider self-start">
                  Live Preview
                </h3>

                <div className="relative p-4.5 bg-white border border-slate-100 rounded-2xl shadow-inner w-full max-w-[280px] aspect-square flex items-center justify-center">
                  <canvas ref={canvasRef} className="w-full h-full max-w-[240px] max-h-[240px]" />
                </div>

                <div className="w-full grid grid-cols-2 gap-2.5 mt-5">
                  <Button variant="outline" size="sm" onClick={handleDownloadPng} leftIcon={<Download className="w-4 h-4" />}>
                    PNG
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadSvg} leftIcon={<Download className="w-4 h-4" />}>
                    SVG
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyClipboard} leftIcon={<Copy className="w-4 h-4" />}>
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
                    Print
                  </Button>
                </div>

                <Button className="w-full mt-4" onClick={handleSaveQr} leftIcon={<Sparkles className="w-4 h-4" />}>
                  Save to Vault
                </Button>
              </div>

              {/* Customize Design Accordions */}
              <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm space-y-5">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  <span>3. Design Branding</span>
                </h3>

                {/* Dot Style Shapes */}
                <div>
                  <Label>Dots Shape Style</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {(["square", "rounded", "dots"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setStyling({ ...styling, dotsType: mode })}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border cursor-pointer capitalize ${
                          styling.dotsType === mode
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color and Gradients */}
                <div className="space-y-4 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="mb-0">Enable Gradient Fill</Label>
                    <input
                      type="checkbox"
                      className="w-4.5 h-4.5 accent-primary cursor-pointer"
                      checked={gradientEnabled}
                      onChange={(e) => setGradientEnabled(e.target.checked)}
                    />
                  </div>

                  {!gradientEnabled ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Dots Color</Label>
                        <div className="flex gap-2 items-center mt-1">
                          <input
                            type="color"
                            className="w-9 h-9 rounded-lg border border-border cursor-pointer"
                            value={styling.dotsColor}
                            onChange={(e) => setStyling({ ...styling, dotsColor: e.target.value })}
                          />
                          <input
                            type="text"
                            className="border border-border rounded-lg px-2 py-1 text-xs w-20 text-foreground"
                            value={styling.dotsColor}
                            onChange={(e) => setStyling({ ...styling, dotsColor: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Background</Label>
                        <div className="flex gap-2 items-center mt-1">
                          <input
                            type="color"
                            className="w-9 h-9 rounded-lg border border-border cursor-pointer"
                            value={styling.backgroundColor}
                            onChange={(e) => setStyling({ ...styling, backgroundColor: e.target.value })}
                          />
                          <input
                            type="text"
                            className="border border-border rounded-lg px-2 py-1 text-xs w-20 text-foreground"
                            value={styling.backgroundColor}
                            onChange={(e) => setStyling({ ...styling, backgroundColor: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 p-3 bg-secondary/30 rounded-xl border border-border/60">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Gradient Start</Label>
                          <input
                            type="color"
                            className="w-9 h-9 rounded-lg border border-border cursor-pointer mt-1"
                            value={gradient.color1}
                            onChange={(e) => setGradient({ ...gradient, color1: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Gradient End</Label>
                          <input
                            type="color"
                            className="w-9 h-9 rounded-lg border border-border cursor-pointer mt-1"
                            value={gradient.color2}
                            onChange={(e) => setGradient({ ...gradient, color2: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Select
                          label="Gradient Type"
                          options={[
                            { value: "linear", label: "Linear" },
                            { value: "radial", label: "Radial" },
                          ]}
                          value={gradient.type}
                          onChange={(e) => setGradient({ ...gradient, type: e.target.value as any })}
                        />
                        {gradient.type === "linear" && (
                          <Input
                            label="Angle (deg)"
                            type="number"
                            min="0"
                            max="360"
                            value={gradient.angle}
                            onChange={(e) => setGradient({ ...gradient, angle: parseInt(e.target.value) || 0 })}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Logo upload inside QR */}
                <div className="border-t border-border pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="mb-0 flex items-center gap-1">
                      <LogoIcon className="w-4 h-4 text-muted-foreground" />
                      <span>Center Logo Image</span>
                    </Label>
                    {logoFile && (
                      <button
                        onClick={() => setLogoFile("")}
                        className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>

                  {!logoFile ? (
                    <div className="border border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer relative bg-secondary/10">
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                      <Upload className="w-5 h-5 text-muted-foreground mb-1.5" />
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        Upload brand badge logo
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <img src={logoFile} className="w-12 h-12 rounded-xl object-contain border border-border p-1 bg-white" />
                        <div className="flex-1">
                          <Label className="text-[10px]">Logo Dimension Size</Label>
                          <input
                            type="range"
                            min="0.1"
                            max="0.28"
                            step="0.01"
                            className="w-full accent-primary mt-1"
                            value={styling.logoSize}
                            onChange={(e) => setStyling({ ...styling, logoSize: parseFloat(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error correction levels */}
                <div className="border-t border-border pt-4">
                  <Label className="flex items-center gap-1.5">
                    <span>ECC Level (Error Correction)</span>
                    <span title="High allows logo embedding and scannability even when dirty">
                      <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </span>
                  </Label>
                  <div className="grid grid-cols-4 gap-2 mt-1.5">
                    {(["L", "M", "Q", "H"] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setStyling({ ...styling, errorCorrectionLevel: level })}
                        className={`py-1.5 text-xs font-bold rounded-lg border cursor-pointer ${
                          styling.errorCorrectionLevel === level
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Bulk creation interface */
          <motion.div
            key="bulk"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Bulk details input (Col span 7) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm space-y-5">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border pb-3">
                  <Layers className="w-4 h-4 text-primary" />
                  <span>Bulk Content Inputs</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Input Types"
                    options={[
                      { value: "url", label: "Websites (one per line)" },
                      { value: "text", label: "Text Strings (one per line)" },
                    ]}
                    value={bulkType}
                    onChange={(e) => setBulkType(e.target.value as any)}
                  />
                  <Input
                    label="Output Filename Prefix"
                    placeholder="e.g. CampaignCode"
                    value={bulkTitlePrefix}
                    onChange={(e) => setBulkTitlePrefix(e.target.value)}
                  />
                </div>

                <Textarea
                  label="Bulk Data Payload (One per line)"
                  rows={8}
                  placeholder={
                    bulkType === "url"
                      ? "https://google.com\nhttps://github.com\nhttps://vercel.com"
                      : "User Code 01\nUser Code 02\nUser Code 03"
                  }
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Bulk details preview / download (Col span 5) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm flex flex-col items-center">
                <h3 className="text-xs font-bold text-foreground mb-4 uppercase tracking-wider self-start">
                  Bulk Package Generator
                </h3>

                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-center w-full space-y-4">
                  <QrCode className="w-12 h-12 text-primary mx-auto animate-pulse" />
                  <div>
                    <h4 className="font-bold text-sm text-foreground">ZIP Archive Export</h4>
                    <p className="text-[10px] text-muted-foreground mt-1 max-w-[220px] mx-auto">
                      All codes generated using current styling config on the right. Downloaded as a zipped folder of PNG images.
                    </p>
                  </div>
                  <Button className="w-full" onClick={handleBulkGenerateZip} leftIcon={<Download className="w-4 h-4" />}>
                    Generate and Download ZIP
                  </Button>
                </div>
              </div>

              {/* Design Customizations side panel (reused design components for consistency) */}
              <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm space-y-5">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  <span>Configured Bulk Styling</span>
                </h3>

                <div>
                  <Label>Dots Shape Style</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {(["square", "rounded", "dots"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setStyling({ ...styling, dotsType: mode })}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border cursor-pointer capitalize ${
                          styling.dotsType === mode
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Dots Color</Label>
                    <input
                      type="color"
                      className="w-full h-9 rounded-lg border border-border cursor-pointer mt-1"
                      value={styling.dotsColor}
                      onChange={(e) => setStyling({ ...styling, dotsColor: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Background</Label>
                    <input
                      type="color"
                      className="w-full h-9 rounded-lg border border-border cursor-pointer mt-1"
                      value={styling.backgroundColor}
                      onChange={(e) => setStyling({ ...styling, backgroundColor: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
