import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

// drivemego://payment-result in APK/IPA builds, exp://<ip>:8081/--/payment-result in Expo Go.
export const getAppReturnUrl = () => Linking.createURL("payment-result");

const parseResult = (url) => {
  if (!url) return {};
  const { queryParams } = Linking.parse(url);
  return queryParams || {};
};

/**
 * Opens the gateway checkout in an auth session. The backend tells Stripe/Tap to
 * redirect to /api/mobile-payment/return, which bounces to our deep link; the
 * session detects it, closes the browser, and resolves here.
 *
 * @returns {Promise<{ status: "success" | "cancel" | "dismissed" | string, sessionId?: string, tapId?: string, flow?: string }>}
 */
export const openCheckout = async (checkoutUrl) => {
  const returnUrl = getAppReturnUrl();
  const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl);

  if (result.type !== "success") return { status: "dismissed" };

  const params = parseResult(result.url);
  const raw = String(params.status || "unknown").toLowerCase();
  return {
    status: raw === "cancelled" || raw === "canceled" ? "cancel" : raw,
    sessionId: params.session_id,
    tapId: params.tap_id,
    flow: params.flow,
  };
};
