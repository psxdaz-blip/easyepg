// workers/logo-cdn/index.ts — EasyEPG logo CDN Worker
// Serves https://cdn.easyepg.tv/logos/{key}

interface Env {
  R2: R2Bucket;
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health / version
    if (url.pathname === '/_version') {
      return new Response(env.ENVIRONMENT || 'production', {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Only serve /logos/*
    if (!url.pathname.startsWith('/logos/')) {
      return new Response('Not Found', { status: 404 });
    }

    const key = url.pathname.replace('/logos/', '');

    if (!key || key === 'placeholder.png') {
      // Return a 1x1 transparent PNG as placeholder
      return new Response(
        new Uint8Array([
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
          0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
          0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
          0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
          0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
          0x54, 0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02,
          0x00, 0x01, 0xE5, 0x27, 0xDE, 0xFC, 0x00, 0x00,
          0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42,
          0x60, 0x82,
        ]),
        {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        }
      );
    }

    try {
      const object = await env.R2.get(key);

      if (object === null) {
        return new Response('Not Found', { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('Access-Control-Allow-Origin', '*');
      if (object.etag) headers.set('ETag', object.etag);

      return new Response(object.body, { headers });
    } catch (err) {
      return new Response('Internal Error', { status: 500 });
    }
  },
};
