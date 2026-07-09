import { API_BASE_URL } from '../constants/api';
import { buildAuthHeaders } from './auth';
import { encryptText, parseApiJson } from './crypto';

function buildUrl(path, params) {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value || value === 0) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

function shouldEncryptHomeBody(url) {
  try {
    const path = new URL(url, API_BASE_URL).pathname;
    return path.startsWith('/home');
  } catch {
    return false;
  }
}

async function parseResponse(result) {
  const json = await result.json();
  if (!result.ok) {
    const error = new Error(json.message || json.error || `HTTP ${result.status}`);
    error.status = result.status;
    error.response = json;
    throw error;
  }
  return parseApiJson(json);
}

export async function apiGet(path, params) {
  const headers = await buildAuthHeaders();
  const result = await fetch(buildUrl(path, params), { method: 'GET', headers });
  return parseResponse(result);
}

export async function apiPost(path, data) {
  const headers = await buildAuthHeaders({ 'Content-Type': 'application/json' });
  let body;
  const url = buildUrl(path);
  if (shouldEncryptHomeBody(url) && data) {
    const encrypted = encryptText(JSON.stringify(data));
    body = encrypted ? JSON.stringify({ encrypted }) : JSON.stringify(data);
  } else {
    body = JSON.stringify(data ?? {});
  }
  const result = await fetch(url, { method: 'POST', headers, body });
  return parseResponse(result);
}

export async function apiPut(path, data) {
  const headers = await buildAuthHeaders({ 'Content-Type': 'application/json' });
  const result = await fetch(buildUrl(path), {
    method: 'PUT',
    headers,
    body: JSON.stringify(data ?? {}),
  });
  return parseResponse(result);
}
