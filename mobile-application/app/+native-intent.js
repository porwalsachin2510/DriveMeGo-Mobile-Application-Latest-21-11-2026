// Gateways return to drivemego:///payment-result, drivemego://payment-result or
// exp://host/--/payment-result. Normalise every variant to the in-app route so
// it never lands on the Unmatched Route screen.
export function redirectSystemPath({ path }) {
  try {
    if (typeof path === "string" && path.includes("payment-result")) {
      const query = path.includes("?") ? path.slice(path.indexOf("?")) : "";
      return `/payment-result${query}`;
    }
    return path;
  } catch {
    return "/";
  }
}
