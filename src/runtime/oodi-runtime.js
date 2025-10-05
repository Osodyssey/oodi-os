// oodi-runtime.js
export function setAuthToken(token) {
  if (typeof window !== 'undefined') {
    window.__oodi_auth_token = token;
  } else {
    global.__oodi_auth_token = token;
  }
}

async function getAuthHeader() {
  if (typeof window !== 'undefined' && window.__oodi_auth_token) {
    return { Authorization: 'Bearer ' + window.__oodi_auth_token };
  } else if (typeof global !== 'undefined' && global.__oodi_auth_token) {
    return { Authorization: 'Bearer ' + global.__oodi_auth_token };
  }
  return {};
}

export async function __getSecret(name) {
  const headers = { 'Content-Type': 'application/json', ...(await getAuthHeader()) };
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
  const headers = { 'Content-Type': 'application/json', ...(await getAuthHeader()) };
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
