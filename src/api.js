export const API_BASE = `${window.location.protocol}//${window.location.hostname}/skillswap-campus/backend`;

const API_URL = API_BASE;
let csrfToken = "";
let csrfRefreshPromise = null;

async function refreshCsrfToken() {
  if (!csrfRefreshPromise) {
    csrfRefreshPromise = fetch(`${API_URL}/me.php`, {
      method: "GET",
      credentials: "include",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json",
      },
      cache: "no-store",
    })
      .then(async (response) => {
        let data = null;
        try { data = await response.json(); } catch { /* handled below */ }
        if (!response.ok || !data || typeof data.csrf_token !== "string" || !data.csrf_token) {
          throw new Error(data?.message || "Your login session could not be refreshed. Please sign in again.");
        }
        csrfToken = data.csrf_token;
        return csrfToken;
      })
      .finally(() => { csrfRefreshPromise = null; });
  }
  return csrfRefreshPromise;
}

async function sendRequest(endpoint, options, token) {
  const method = (options.method || "GET").toUpperCase();
  const headers = {
    ...((typeof FormData !== "undefined" && options.body instanceof FormData)
      ? {}
      : { "Content-Type": "application/json" }),
    "X-Requested-With": "XMLHttpRequest",
    ...options.headers,
  };

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
      !["login.php", "register.php"].includes(endpoint.split("?")[0]) && token) {
    headers["X-CSRF-Token"] = token;
  }

  return fetch(`${API_URL}/${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
    cache: "no-store",
  });
}

async function readResponse(response) {
  let data;
  try { data = await response.json(); } catch { data = null; }
  return data;
}

export async function apiRequest(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const isAuthEntry = ["login.php", "register.php"].includes(endpoint.split("?")[0]);

  if (isMutation && !isAuthEntry && !csrfToken) {
    await refreshCsrfToken();
  }

  let response = await sendRequest(endpoint, options, csrfToken);
  let data = await readResponse(response);

  // A browser refresh, older tab, or regenerated PHP session can leave the
  // in-memory token stale. A rejected CSRF check has no side effects, so
  // refresh the session token and safely retry this request once.
  if (isMutation && !isAuthEntry && response.status === 403 &&
      data?.message === "Your security session expired. Refresh the page and try again.") {
    await refreshCsrfToken();
    response = await sendRequest(endpoint, options, csrfToken);
    data = await readResponse(response);
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
