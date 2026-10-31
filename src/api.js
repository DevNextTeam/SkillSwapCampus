
const API_URL = "http://10.0.9.203/skillswap-campus/backend";

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_URL}/${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}
