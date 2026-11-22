import express from "express"
import { isAllowedAppReturnUrl } from "../utils/paymentReturn.js"

const router = express.Router()

const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])

const FORWARDED_PARAMS = ["status", "session_id", "tap_id", "flow"]

/**
 * GET /api/mobile-payment/return?flow=wallet&app=drivemego://payment-result&status=success&session_id=cs_...
 *
 * Stripe/Tap redirect here after a checkout started from the mobile app. We
 * immediately bounce the browser to the app's deep link with the gateway
 * result so the in-app browser closes and the app verifies the payment.
 */
router.get("/return", (req, res) => {
    const app = String(req.query.app || "")
    const target = isAllowedAppReturnUrl(app) ? app : "drivemego://payment-result"

    const params = new URLSearchParams()
    for (const key of FORWARDED_PARAMS) {
        const value = req.query[key]
        if (typeof value === "string" && value.length <= 300) params.set(key, value)
    }
    if (!params.get("status")) params.set("status", req.query.tap_id ? "success" : "unknown")

    const deepLink = `${target}${target.includes("?") ? "&" : "?"}${params.toString()}`
    const safeLink = escapeHtml(deepLink)
    const succeeded = params.get("status") === "success"

    res.set("Cache-Control", "no-store")
    res.set("Content-Type", "text/html; charset=utf-8")
    res.send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="0;url=${safeLink}">
<title>Returning to Drive Me Go</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:-apple-system,system-ui,Segoe UI,Roboto,sans-serif;background:#F4FAFC;color:#0F2E4D}
  main{max-width:360px;padding:32px 24px;text-align:center}
  h1{font-size:20px;margin:0 0 8px}
  p{font-size:15px;line-height:1.5;color:#4B6275;margin:0 0 24px}
  a{display:inline-block;background:#00A3B4;color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:999px}
</style>
</head>
<body>
<main>
  <h1>${succeeded ? "Payment received" : "Payment not completed"}</h1>
  <p>Taking you back to the Drive Me Go app...</p>
  <a href="${safeLink}">Return to the app</a>
</main>
<script>setTimeout(function(){window.location.replace(${JSON.stringify(deepLink).replace(/</g, "\\u003c")})},50)</script>
</body>
</html>`)
})

export default router
