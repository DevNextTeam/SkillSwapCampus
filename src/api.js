export const API_BASE = `${window.location.protocol}//${window.location.hostname}/skillswap-campus/backend`;

const API_URL = API_BASE;
let csrfToken = "";

export async function apiRequest(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = {
    ...((typeof FormData !== "undefined" && options.body instanceof FormData)
      ? {}
      : { "Content-Type": "application/json" }),
    "X-Requested-With": "XMLHttpRequest",
    ...options.headers,
  };
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
      !["login.php", "register.php"].includes(endpoint.split("?")[0]) && csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const response = await fetch(`${API_URL}/${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      (response.status
        ? `The server returned an error (${response.status}). Please try again.`
        : "Something went wrong.")
    );
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("The server returned an invalid response. Please try again.");
  }

  if (typeof data.csrf_token === "string" && data.csrf_token) csrfToken = data.csrf_token;
  if (endpoint.split("?")[0] === "logout.php" && data.success === true) csrfToken = "";

  if (data.success === false) {
    throw new Error(data.message || "The request could not be completed. Please try again.");
  }

  return data;
}
