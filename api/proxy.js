export default async function handler(req, res) {
  const TARGET = "https://www.horsesmouthapp.com";
  const path = req.url.replace('/api/proxy', '');
  const targetUrl = TARGET + path;

  const headers = { ...req.headers };
  delete headers.host;
  headers.origin = TARGET;

  const fetchOptions = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    fetchOptions.body = JSON.stringify(req.body);
    headers['content-type'] = 'application/json';
  }

  const response = await fetch(targetUrl, fetchOptions);
  const data = await response.json().catch(() => ({}));

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  res.status(response.status).json(data);
}
