const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

async function parseJson(res) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || `Request failed (${res.status})`);
  }
  return json;
}

export function getXBeatApiBase() {
  return API_BASE;
}

export async function fetchXBeatProducts(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v != null && v !== '') params.set(k, String(v));
  });
  const qs = params.toString();
  const url = `${API_BASE}/x-beat/products${qs ? `?${qs}` : ''}`;
  const res = await fetch(url);
  const json = await parseJson(res);
  if (!json.success) throw new Error(json.message || 'Failed to load products');
  return json.data;
}

export async function fetchXBeatProduct(platform, slug) {
  const url = `${API_BASE}/x-beat/products/${encodeURIComponent(platform)}/${encodeURIComponent(slug)}`;
  const res = await fetch(url);
  const json = await parseJson(res);
  if (!json.success) throw new Error(json.message || 'Product not found');
  return json.data;
}

export async function fetchXBeatRelated(platform, slug) {
  const url = `${API_BASE}/x-beat/products/${encodeURIComponent(platform)}/${encodeURIComponent(slug)}/related`;
  const res = await fetch(url);
  const json = await parseJson(res);
  if (!json.success) throw new Error(json.message || 'Failed to load related products');
  return json.data;
}
