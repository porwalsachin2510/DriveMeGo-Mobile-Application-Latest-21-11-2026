/**
 * Decides where a payment gateway (Stripe / Tap) sends the user after checkout.
 *
 * - Web app requests      -> FRONTEND_URL + webPath  (unchanged behaviour)
 * - Mobile app requests   -> this backend's /api/mobile-payment/return bridge,
 *                            which hands the result back to the app via its
 *                            deep link (drivemego://payment-result?...).
 *
 * Gateways only accept http(s) success/cancel URLs, so the app's custom-scheme
 * deep link cannot be given to them directly; the HTTPS bridge is required.
 *
 * The mobile app identifies itself with two headers on every API request:
 *   X-Client-Platform: mobile
 *   X-App-Return-Url:  drivemego://payment-result   (exp://... in Expo Go)
 */

// Fixes common .env typos such as "http:///host" and trailing slashes.
export const normalizeBaseUrl = (url) =>
    String(url || "")
        .trim()
        .replace(/^(https?:)\/{3,}/i, "$1//")
        .replace(/\/+$/, "")

export const splitUrlList = (value) =>
    String(value || "")
        .split(",")
        .map(normalizeBaseUrl)
        .filter(Boolean)

export const getFrontendBaseUrl = () => splitUrlList(process.env.FRONTEND_URL)[0] || "http://localhost:5173"

const DEFAULT_APP_SCHEMES = ["drivemego://", "exp://", "exps://"]

const allowedAppSchemes = () => {
    const extra = String(process.env.MOBILE_APP_SCHEMES || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .map((s) => (s.includes("://") ? s : `${s}://`))
    return [...new Set([...DEFAULT_APP_SCHEMES, ...extra])]
}

export const isAllowedAppReturnUrl = (url) => {
    if (!url || typeof url !== "string" || url.length > 500) return false
    const lower = url.trim().toLowerCase()
    return allowedAppSchemes().some((scheme) => lower.startsWith(scheme))
}

export const isMobileClient = (req) => {
    const header = String(req?.get?.("x-client-platform") || "").toLowerCase()
    const body = String(req?.body?.clientPlatform || "").toLowerCase()
    return header === "mobile" || body === "mobile"
}

export const getAppReturnUrl = (req) => {
    const candidate = req?.get?.("x-app-return-url") || req?.body?.appReturnUrl
    return isAllowedAppReturnUrl(candidate) ? candidate.trim() : "drivemego://payment-result"
}

// Public URL of THIS backend as seen by the phone. In production set
// PUBLIC_API_URL=https://api.drivemego.com; otherwise it is derived from the
// request (works for LAN IPs in development because the phone called us there).
export const getPublicBackendUrl = (req) => {
    const configured = normalizeBaseUrl(process.env.PUBLIC_API_URL)
    if (configured) return configured
    if (req?.get) {
        const proto = String(req.get("x-forwarded-proto") || req.protocol || "http").split(",")[0].trim()
        const host = req.get("x-forwarded-host") || req.get("host")
        if (host) return `${proto}://${host}`
    }
    return splitUrlList(process.env.BACKEND_URL)[0] || "http://localhost:5000"
}

/**
 * @param {import("express").Request | null} req
 * @param {{ webPath: string, flow: "wallet" | "booking" | "renewal" | string }} options
 * @returns {string} http(s) URL to hand to the payment gateway as redirectUrl
 */
export const buildPaymentRedirectUrl = (req, { webPath, flow }) => {
    if (req && isMobileClient(req)) {
        const params = new URLSearchParams({ flow: flow || "payment", app: getAppReturnUrl(req) })
        return `${getPublicBackendUrl(req)}/api/mobile-payment/return?${params.toString()}`
    }
    const path = webPath.startsWith("/") ? webPath : `/${webPath}`
    return `${getFrontendBaseUrl()}${path}`
}
