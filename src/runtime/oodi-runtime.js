// oodi-runtime.js
// runtime supports setting a client auth token for server requests
export function setAuthToken(token) {
  if (typeof window !== 'undefined') {
    window.__oodi_auth_token = token;
  }
}

export async function __getSecret(name) {
  const headers = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined' && window.__oodi_auth_token) {
    headers['Authorization'] = 'Bearer ' + window.__oodi_auth_token;
  }
  const res = await fetch('/api/get-secret-token', {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify({ name })
  });
  if (!res.ok) {
    const txt = await res.text().catch(()=>null);
    throw new Error('Could not get secret token: ' + (txt || res.status));
  }
  const { token } = await res.json();
  return token;
}

export async function __call(endpoint, data) {
  const headers = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined' && window.__oodi_auth_token) {
    headers['Authorization'] = 'Bearer ' + window.__oodi_auth_token;
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const txt = await res.text().catch(()=>null);
    throw new Error('Call failed: ' + (txt || res.status));
  }
  return res.json();
}
