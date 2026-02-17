const BASE_URL = '';

async function request(method, url, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${url}`, options);
  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.error || 'Request failed');
    error.status = res.status;
    throw error;
  }

  return data;
}

async function upload(url, formData) {
  const headers = {};
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${url}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.error || 'Upload failed');
    error.status = res.status;
    throw error;
  }

  return data;
}

export default {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body),
  put: (url, body) => request('PUT', url, body),
  delete: (url) => request('DELETE', url),
  upload,
};
