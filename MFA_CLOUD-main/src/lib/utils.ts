import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to parse user agent and get device info
export function getDeviceInfo(userAgent: string | null | undefined): string {
  if (!userAgent) return "Unknown Device";
  
  // Detect OS
  let os = "Unknown OS";
  if (userAgent.includes("Windows NT 10")) os = "Windows 10";
  else if (userAgent.includes("Windows NT 11")) os = "Windows 11";
  else if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac OS X")) os = "macOS";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iOS") || userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
  
  // Detect Browser
  let browser = "Unknown Browser";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
  else if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Opera") || userAgent.includes("OPR")) browser = "Opera";
  
  // Detect Device Type
  let deviceType = "";
  if (userAgent.includes("Mobile")) deviceType = "Mobile";
  else if (userAgent.includes("Tablet") || userAgent.includes("iPad")) deviceType = "Tablet";
  else deviceType = "Desktop";
  
  return `${browser} · ${os}`;
}

// Helper function to parse user agent and get detailed device info
export interface DeviceDetails {
  browser: string;
  os: string;
  deviceType: string;
  deviceName: string;
}

export function parseDeviceDetails(userAgent: string | null | undefined): DeviceDetails {
  if (!userAgent) {
    return {
      browser: "Unknown Browser",
      os: "Unknown OS",
      deviceType: "Desktop",
      deviceName: "Unknown Device"
    };
  }
  
  // Detect OS
  let os = "Unknown OS";
  if (userAgent.includes("Windows NT 10")) os = "Windows 10";
  else if (userAgent.includes("Windows NT 11")) os = "Windows 11";
  else if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac OS X")) os = "macOS";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iOS") || userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
  
  // Detect Browser
  let browser = "Unknown Browser";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
  else if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Opera") || userAgent.includes("OPR")) browser = "Opera";
  
  // Detect Device Type
  let deviceType = "Desktop";
  if (userAgent.includes("Mobile")) deviceType = "Mobile";
  else if (userAgent.includes("Tablet") || userAgent.includes("iPad")) deviceType = "Tablet";
  
  const deviceName = `${browser} on ${os}`;
  
  return {
    browser,
    os,
    deviceType,
    deviceName
  };
}
