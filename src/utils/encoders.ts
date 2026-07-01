import { format } from "date-fns";

export interface ContactData {
  name: string;
  phone: string;
  email: string;
  company: string;
  website: string;
}

export interface WifiData {
  ssid: string;
  password?: string;
  encryption: "WPA" | "WEP" | "nopass";
  hidden?: boolean;
}

export interface EmailData {
  email: string;
  subject?: string;
  message?: string;
}

export interface SmsData {
  phone: string;
  message?: string;
}

export interface LocationData {
  latitude: string;
  longitude: string;
}

export interface EventData {
  title: string;
  location?: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
  startTime?: string; // HH:MM
  endDate?: string; // ISO date string
  endTime?: string; // HH:MM
  description?: string;
}

/**
 * Format string helpers for encoding QR code payloads
 */

export const encodeWifi = (data: WifiData): string => {
  const { ssid, password = "", encryption, hidden = false } = data;
  // Escape special characters in SSID and Password
  const escapeChar = (str: string) => str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/:/g, "\\:").replace(/,/g, "\\,");
  
  return `WIFI:S:${escapeChar(ssid)};T:${encryption};P:${escapeChar(password)};H:${hidden ? "true" : "false"};;`;
};

export const encodeVCard = (data: ContactData): string => {
  const { name, phone, email, company, website } = data;
  const parts = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${name}`,
    `N:${name};;;;`,
    phone ? `TEL;TYPE=CELL:${phone}` : "",
    email ? `EMAIL;TYPE=INTERNET,HOME:${email}` : "",
    company ? `ORG:${company}` : "",
    website ? `URL:${website}` : "",
    "END:VCARD",
  ];
  return parts.filter(Boolean).join("\n");
};

export const encodeEmail = (data: EmailData): string => {
  const { email, subject = "", message = "" } = data;
  const urlParams = new URLSearchParams();
  if (subject) urlParams.append("subject", subject);
  if (message) urlParams.append("body", message);
  const queryString = urlParams.toString().replace(/\+/g, "%20");
  return `mailto:${email}${queryString ? `?${queryString}` : ""}`;
};

export const encodeSms = (data: SmsData): string => {
  const { phone, message = "" } = data;
  return `SMSTO:${phone}:${message}`;
};

export const encodeLocation = (data: LocationData): string => {
  const { latitude, longitude } = data;
  // Standard Google Maps query URL
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
};

export const encodeEvent = (data: EventData): string => {
  const { title, location = "", startDate, startTime = "00:00", endDate, endTime = "23:59", description = "" } = data;

  const formatDateIcs = (dateStr: string, timeStr: string) => {
    // Input format: YYYY-MM-DD and HH:MM
    const datePart = dateStr.replace(/-/g, "");
    const timePart = timeStr.replace(/:/g, "");
    return `${datePart}T${timePart}00`; // YYYYMMDDTHHMMSS
  };

  const endD = endDate || startDate;
  const endT = endTime || startTime;

  const startFormatted = formatDateIcs(startDate, startTime);
  const endFormatted = formatDateIcs(endD, endT);

  const parts = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${title}`,
    `DTSTART:${startFormatted}`,
    `DTEND:${endFormatted}`,
    location ? `LOCATION:${location}` : "",
    description ? `DESCRIPTION:${description}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return parts.join("\n");
};
