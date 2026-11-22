import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};

// Also repairs the common "http:///host" typo, which otherwise breaks every request.
const normalizeUrl = (url) =>
  (url || "")
    .trim()
    .replace(/^(https?:)\/{3,}/i, "$1//")
    .replace(/\/+$/, "");

export const API_URL = normalizeUrl(process.env.EXPO_PUBLIC_API_URL || extra.apiUrl || "http://localhost:5000");
export const API_BASE = `${API_URL}/api`;
export const SOCKET_URL = API_URL;
export const WEB_URL = normalizeUrl(process.env.EXPO_PUBLIC_WEB_URL || extra.webUrl || "https://drivemego.com");
