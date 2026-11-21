const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
export function getToken() { return localStorage.getItem("civic_token"); }
export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (getToken()) headers.Authorization = `Token ${getToken()}`;
  if (!(options.body instanceof FormData) && options.body) headers["Content-Type"] = "application/json";
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || Object.values(data).flat().join(" ") || "Request failed");
  return data;
}
export const imageUrl = (url) => url?.startsWith("http") ? url : url ? `http://127.0.0.1:8000${url}` : "";
