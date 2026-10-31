const API_URL = "http://10.0.9.203/skillswap-campus/backend";

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_URL}/${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      ...((typeof FormData !== "undefined" && options.body instanceof FormData)
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
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

  if (!data || typeof data !== "object") {
    throw new Error("The server returned an invalid response. Please try again.");
  }

  return data;
}
