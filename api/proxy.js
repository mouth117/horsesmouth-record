export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const TARGET = "https://www.horsesmouthapp.com";
  const path = req.url.replace('/api/proxy', '');
  const targetUrl = TARGET + path;

  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Build headers - forward everything except host
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (key.toLowerCase() !== 'host') {
      headers[key] = value;
    }
  }
  headers['origin'] = TARGET;

  // Stream the body directly for all methods
  const fetchOptions = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    // Stream raw body to support both JSON and multipart/form-data
    fetchOptions.body = req;
    fetchOptions.duplex = 'half';
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);
    
    // Forward response headers
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, value);
      }
    });

    // Re-set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(response.status);

    // Stream response body
    const reader = response.body.getReader();
    const stream = new ReadableStream({
      start(controller) {
        function push() {
          reader.read().then(({ done, value }) => {
            if (done) { controller.close(); return; }
            controller.enqueue(value);
            push();
          });
        }
        push();
      }
    });

    const responseBuffer = await new Response(stream).arrayBuffer();
    res.end(Buffer.from(responseBuffer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
