import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

// drivemego:///payment-result in APK/IPA builds, exp://<ip>:8081/--/payment-result in Expo Go.
export const getAppReturnUrl = () => Linking.createURL("payment-result");

const isPaymentResultUrl = (url) => typeof url === "string" && url.includes("payment-result");

export const parsePaymentResult = (paramsOrUrl) => {
  const params =
    typeof paramsOrUrl === "string" ? Linking.parse(paramsOrUrl).queryParams || {} : paramsOrUrl || {};
  const raw = String(params.status || "unknown").toLowerCase();
  return {
    status: raw === "cancelled" || raw === "canceled" ? "cancel" : raw,
    sessionId: params.session_id,
    tapId: params.tap_id,
    flow: params.flow,
  };
};

let checkoutInProgress = false;
export const isCheckoutInProgress = () => checkoutInProgress;

/**
 * Opens the gateway checkout in an auth session. The backend tells Stripe/Tap to
 * redirect to /api/mobile-payment/return, which bounces to our deep link.
 *
 * On Android the deep link is often delivered to the app as an intent instead of
 * to the auth session, which then resolves as "dismissed". We therefore also
 * listen for the deep link ourselves and prefer it when it arrives.
 */
export const openCheckout = async (checkoutUrl) => {
  const returnUrl = getAppReturnUrl();
  let deepLinkUrl = null;
  const sub = Linking.addEventListener("url", ({ url }) => {
    if (isPaymentResultUrl(url)) deepLinkUrl = url;
  });

  checkoutInProgress = true;
  try {
    const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl);
    if (result.type === "success" && isPaymentResultUrl(result.url)) return parsePaymentResult(result.url);

    // The intent can land a moment after the browser closes.
    if (!deepLinkUrl) await new Promise((r) => setTimeout(r, 600));
    if (deepLinkUrl) return parsePaymentResult(deepLinkUrl);
    return { status: "dismissed" };
  } finally {
    checkoutInProgress = false;
    sub.remove();
  }
};
