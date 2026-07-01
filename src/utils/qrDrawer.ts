import QRCode from "qrcode";
import { QrStylingOptions } from "../types";

/**
 * Custom QR Draw Engine
 * Renders a QR code to a canvas or creates an SVG string with custom branding options.
 */

// Helper to load image from base64 string
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
};

export async function drawQrOnCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  options: QrStylingOptions
): Promise<void> {
  const {
    size = 400,
    errorCorrectionLevel = "H",
    dotsColor = "#000000",
    dotsType = "square",
    backgroundColor = "#ffffff",
    gradient,
    logo,
    logoSize = 0.2, // 20% of QR size by default
    logoMargin = 6,
  } = options;

  // Generate QR matrix
  const qr = QRCode.create(text, { errorCorrectionLevel });
  const { modules } = qr;
  const moduleCount = modules.size;

  // Set canvas dimensions
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Clear and fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, size, size);

  // Calculate module size
  const moduleSize = size / moduleCount;

  // Configure dot fill style (color or gradient)
  let fillStyle: string | CanvasGradient = dotsColor;
  if (gradient) {
    if (gradient.type === "linear") {
      // Calculate angle coordinates
      const angleRad = (gradient.angle * Math.PI) / 180;
      const r = size / 2;
      const cx = size / 2;
      const cy = size / 2;
      const x1 = cx - r * Math.cos(angleRad);
      const y1 = cy - r * Math.sin(angleRad);
      const x2 = cx + r * Math.cos(angleRad);
      const y2 = cy + r * Math.sin(angleRad);

      const linearGrad = ctx.createLinearGradient(x1, y1, x2, y2);
      linearGrad.addColorStop(0, gradient.color1);
      linearGrad.addColorStop(1, gradient.color2);
      fillStyle = linearGrad;
    } else {
      // Radial gradient
      const radialGrad = ctx.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size * 0.7
      );
      radialGrad.addColorStop(0, gradient.color1);
      radialGrad.addColorStop(1, gradient.color2);
      fillStyle = radialGrad;
    }
  }
  ctx.fillStyle = fillStyle;

  // Detect which modules are finder patterns (outer three 7x7 squares)
  // Top-left: (0,0) to (6,6)
  // Top-right: (0, moduleCount-7) to (6, moduleCount-1)
  // Bottom-left: (moduleCount-7, 0) to (moduleCount-1, 6)
  const isFinderPattern = (row: number, col: number): boolean => {
    if (row < 7 && col < 7) return true; // Top-Left
    if (row < 7 && col >= moduleCount - 7) return true; // Top-Right
    if (row >= moduleCount - 7 && col < 7) return true; // Bottom-Left
    return false;
  };

  // Keep track of the center area for the logo to avoid drawing modules there
  // We'll mask out center modules if a logo is present.
  const logoModulesCount = Math.floor(moduleCount * logoSize);
  const centerStart = Math.floor((moduleCount - logoModulesCount) / 2);
  const centerEnd = centerStart + logoModulesCount;

  const shouldSkipForLogo = (row: number, col: number): boolean => {
    if (!logo) return false;
    // Mask center cells (including margin around it)
    const marginCells = 1;
    return (
      row >= centerStart - marginCells &&
      row < centerEnd + marginCells &&
      col >= centerStart - marginCells &&
      col < centerEnd + marginCells
    );
  };

  // Draw modules
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (modules.get(r, c) === 1) {
        if (shouldSkipForLogo(r, c)) continue;

        const x = c * moduleSize;
        const y = r * moduleSize;

        ctx.beginPath();

        // Standard finder patterns are always square for high scanning reliability
        const currentDotsType = isFinderPattern(r, c) ? "square" : dotsType;

        if (currentDotsType === "square") {
          ctx.rect(x, y, moduleSize + 0.5, moduleSize + 0.5); // Add 0.5 to prevent thin lines between adjacent cells
          ctx.fill();
        } else if (currentDotsType === "dots") {
          const cx = x + moduleSize / 2;
          const cy = y + moduleSize / 2;
          const radius = (moduleSize / 2) * 0.85; // Slightly smaller than cell for nice dots appearance
          ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
          ctx.fill();
        } else if (currentDotsType === "rounded") {
          const radius = moduleSize * 0.4;
          // Custom path for rounded rectangle module
          if (ctx.roundRect) {
            ctx.roundRect(x + 0.5, y + 0.5, moduleSize - 1, moduleSize - 1, radius);
          } else {
            ctx.rect(x, y, moduleSize, moduleSize);
          }
          ctx.fill();
        }
      }
    }
  }

  // Draw Logo if provided
  if (logo) {
    try {
      const img = await loadImage(logo);
      
      const logoPixelSize = size * logoSize;
      const logoX = (size - logoPixelSize) / 2;
      const logoY = (size - logoPixelSize) / 2;

      // Draw standard margin/backing box
      ctx.fillStyle = backgroundColor;
      ctx.beginPath();
      // Draw rounded rectangle backing for logo
      const boxRadius = logoPixelSize * 0.2;
      ctx.roundRect
        ? ctx.roundRect(
            logoX - logoMargin,
            logoY - logoMargin,
            logoPixelSize + logoMargin * 2,
            logoPixelSize + logoMargin * 2,
            boxRadius
          )
        : ctx.rect(
            logoX - logoMargin,
            logoY - logoMargin,
            logoPixelSize + logoMargin * 2,
            logoPixelSize + logoMargin * 2
          );
      ctx.fill();

      // Draw actual logo
      ctx.drawImage(img, logoX, logoY, logoPixelSize, logoPixelSize);
    } catch (e) {
      console.error("Failed to render logo on canvas:", e);
    }
  }
}

export async function drawQrToSvgString(
  text: string,
  options: QrStylingOptions
): Promise<string> {
  const {
    size = 400,
    errorCorrectionLevel = "H",
    dotsColor = "#000000",
    dotsType = "square",
    backgroundColor = "#ffffff",
    gradient,
    logo,
    logoSize = 0.2,
    logoMargin = 6,
  } = options;

  const qr = QRCode.create(text, { errorCorrectionLevel });
  const { modules } = qr;
  const moduleCount = modules.size;
  const moduleSize = size / moduleCount;

  // Prepare Gradient XML if present
  let defs = "";
  let fillAttr = dotsColor;

  if (gradient) {
    fillAttr = "url(#qr-gradient)";
    if (gradient.type === "linear") {
      // Approximate coordinate angles
      const angleRad = (gradient.angle * Math.PI) / 180;
      const x1 = Math.round(50 - 50 * Math.cos(angleRad));
      const y1 = Math.round(50 - 50 * Math.sin(angleRad));
      const x2 = Math.round(50 + 50 * Math.cos(angleRad));
      const y2 = Math.round(50 + 50 * Math.sin(angleRad));
      defs = `
        <defs>
          <linearGradient id="qr-gradient" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
            <stop offset="0%" stop-color="${gradient.color1}" />
            <stop offset="100%" stop-color="${gradient.color2}" />
          </linearGradient>
        </defs>
      `;
    } else {
      defs = `
        <defs>
          <radialGradient id="qr-gradient" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stop-color="${gradient.color1}" />
            <stop offset="100%" stop-color="${gradient.color2}" />
          </radialGradient>
        </defs>
      `;
    }
  }

  const isFinderPattern = (row: number, col: number): boolean => {
    if (row < 7 && col < 7) return true;
    if (row < 7 && col >= moduleCount - 7) return true;
    if (row >= moduleCount - 7 && col < 7) return true;
    return false;
  };

  const logoModulesCount = Math.floor(moduleCount * logoSize);
  const centerStart = Math.floor((moduleCount - logoModulesCount) / 2);
  const centerEnd = centerStart + logoModulesCount;

  const shouldSkipForLogo = (row: number, col: number): boolean => {
    if (!logo) return false;
    const marginCells = 1;
    return (
      row >= centerStart - marginCells &&
      row < centerEnd + marginCells &&
      col >= centerStart - marginCells &&
      col < centerEnd + marginCells
    );
  };

  let paths = "";

  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (modules.get(r, c) === 1) {
        if (shouldSkipForLogo(r, c)) continue;

        const x = c * moduleSize;
        const y = r * moduleSize;
        const currentDotsType = isFinderPattern(r, c) ? "square" : dotsType;

        if (currentDotsType === "square") {
          // Simple rect with slight offset adjustments
          paths += `<rect x="${x}" y="${y}" width="${moduleSize + 0.1}" height="${moduleSize + 0.1}" fill="${fillAttr}" />\n`;
        } else if (currentDotsType === "dots") {
          const cx = x + moduleSize / 2;
          const cy = y + moduleSize / 2;
          const radius = (moduleSize / 2) * 0.85;
          paths += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fillAttr}" />\n`;
        } else if (currentDotsType === "rounded") {
          const radius = moduleSize * 0.4;
          paths += `<rect x="${x + 0.5}" y="${y + 0.5}" width="${moduleSize - 1}" height="${moduleSize - 1}" rx="${radius}" ry="${radius}" fill="${fillAttr}" />\n`;
        }
      }
    }
  }

  // Draw Logo in SVG if present
  let logoSvg = "";
  if (logo) {
    const logoPixelSize = size * logoSize;
    const logoX = (size - logoPixelSize) / 2;
    const logoY = (size - logoPixelSize) / 2;
    const boxRadius = logoPixelSize * 0.2;

    logoSvg = `
      <!-- Logo Background Wrapper -->
      <rect x="${logoX - logoMargin}" y="${logoY - logoMargin}" width="${logoPixelSize + logoMargin * 2}" height="${logoPixelSize + logoMargin * 2}" rx="${boxRadius}" ry="${boxRadius}" fill="${backgroundColor}" />
      <!-- Logo Image -->
      <image href="${logo}" x="${logoX}" y="${logoY}" width="${logoPixelSize}" height="${logoPixelSize}" />
    `;
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="100%" height="100%" fill="${backgroundColor}" />
  ${defs}
  <g>
    ${paths}
  </g>
  ${logoSvg}
</svg>`;
}
