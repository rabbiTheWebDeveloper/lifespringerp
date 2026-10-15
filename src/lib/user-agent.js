/**
 * Helper to parse User-Agent strings into browser, OS, device type, and friendly labels.
 */
export function parseUserAgent(ua = "") {
  if (!ua || typeof ua !== "string") {
    return {
      browser: "Unknown Browser",
      os: "Unknown OS",
      deviceType: "desktop",
      deviceLabel: "Unknown Device",
      isMobile: false,
    };
  }

  // ── OS Detection ──
  let os = "Unknown OS";
  if (/windows phone/i.test(ua)) os = "Windows Phone";
  else if (/win64|win32|windows/i.test(ua)) {
    if (/nt 10\.0/i.test(ua)) os = "Windows 10/11";
    else if (/nt 6\.3/i.test(ua)) os = "Windows 8.1";
    else if (/nt 6\.2/i.test(ua)) os = "Windows 8";
    else if (/nt 6\.1/i.test(ua)) os = "Windows 7";
    else os = "Windows";
  } else if (/iphone/i.test(ua)) os = "iOS (iPhone)";
  else if (/ipad/i.test(ua)) os = "iPadOS (iPad)";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) {
    const androidMatch = ua.match(/android\s+([\d.]+)/i);
    os = androidMatch ? `Android ${androidMatch[1]}` : "Android";
  } else if (/linux/i.test(ua)) os = "Linux";
  else if (/cros/i.test(ua)) os = "Chrome OS";

  // ── Browser Detection ──
  let browser = "Unknown Browser";
  if (/edg\//i.test(ua)) {
    const match = ua.match(/edg\/([\d.]+)/i);
    browser = `Microsoft Edge ${match ? match[1].split(".")[0] : ""}`.trim();
  } else if (/samsungbrowser/i.test(ua)) {
    const match = ua.match(/samsungbrowser\/([\d.]+)/i);
    browser = `Samsung Internet ${match ? match[1].split(".")[0] : ""}`.trim();
  } else if (/opera|opr\//i.test(ua)) {
    const match = ua.match(/(?:opera|opr)\/([\d.]+)/i);
    browser = `Opera ${match ? match[1].split(".")[0] : ""}`.trim();
  } else if (/chrome|crios/i.test(ua)) {
    const match = ua.match(/(?:chrome|crios)\/([\d.]+)/i);
    browser = `Google Chrome ${match ? match[1].split(".")[0] : ""}`.trim();
  } else if (/firefox|fxios/i.test(ua)) {
    const match = ua.match(/(?:firefox|fxios)\/([\d.]+)/i);
    browser = `Mozilla Firefox ${match ? match[1].split(".")[0] : ""}`.trim();
  } else if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) {
    const match = ua.match(/version\/([\d.]+)/i);
    browser = `Apple Safari ${match ? match[1].split(".")[0] : ""}`.trim();
  } else if (/postman/i.test(ua)) {
    browser = "Postman Client";
  }

  // ── Device Type Detection ──
  let deviceType = "desktop";
  let isMobile = false;
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    deviceType = "tablet";
    isMobile = true;
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|windows phone/i.test(ua)) {
    deviceType = "mobile";
    isMobile = true;
  }

  const deviceLabel = `${browser} on ${os}`;

  return {
    browser,
    os,
    deviceType,
    deviceLabel,
    isMobile,
  };
}
