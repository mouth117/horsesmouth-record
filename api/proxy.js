export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  const TARGET = "https://www.horsesmouthapp.com";

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Strip /api/proxy prefix to get the actual path
  const url = req.url || '';
  const path = url.replace(/^\/api\/proxy/, '') || '/';
  const targetUrl = TARGET + path;

  console.log('Proxying:', req.method, url, '->', targetUrl);

  // Forward headers except host
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    const lower = key.toLowerCase();
    if (lower !== 'host' && lower !== 'connection') {
      headers[key] = value;
    }
  }
  headers['origin'] = TARGET;

  try {
    // Collect raw body
    const chunks = [];
    await new Promise((resolve, reject) => {
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', resolve);
      req.on('error', reject);
    });

    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && chunks.length > 0) {
      fetchOptions.body = Buffer.concat(chunks);
    }

    const response = await fetch(targetUrl, fetchOptions);
    console.log('Response status:', response.status);

    // Forward response headers
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(lower)) {
        res.setHeader(key, value);
      }
    });
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(response.status);

    const buffer = await response.arrayBuffer();
    res.end(Buffer.from(buffer));
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
}
