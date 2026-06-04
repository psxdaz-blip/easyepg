// workers/playlist-router/index.ts — EasyEPG playlist M3U serving Worker
// Serves https://{subdomain}.easyepg.tv/playlist.m3u

interface Env {
  DB?: D1Database;
  CF_ACCOUNT_ID?: string;
  ENVIRONMENT?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const host = url.hostname;

    // Version/health endpoint
    if (url.pathname === '/_version') {
      return new Response(env.ENVIRONMENT || 'production', {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Root/welcome
    if (url.pathname === '/') {
      return new Response('EasyEPG Playlist Router — use /playlist.m3u', {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Only serve playlist.m3u
    if (url.pathname !== '/playlist.m3u') {
      return new Response('Not Found', { status: 404 });
    }

    // Extract subdomain from hostname
    let slug: string | null = null;
    if (host.endsWith('.easyepg.tv')) {
      slug = host.split('.')[0];
    } else if (host.includes('.workers.dev')) {
      slug = 'demo'; // default slug for workers.dev
    } else {
      return new Response('Custom domain not configured', { status: 404 });
    }

    if (!slug || slug === 'www' || slug === 'cdn') {
      return new Response('Not Found', { status: 404 });
    }

    try {
      // Fetch playlist channels from D1
      // const channels = await env.DB.prepare(`
      //   SELECT c.* FROM playlist_channels pc
      //   JOIN channels c ON c.id = pc.channel_id
      //   JOIN playlists p ON p.id = pc.playlist_id
      //   WHERE p.slug = ? AND pc.enabled = TRUE AND c.is_active = TRUE
      //   ORDER BY pc.channel_number ASC
      // `).bind(slug).all();

      // Placeholder M3U while DB is being set up
      const m3u = `#EXTM3U
# EasyEPG — ${slug}
# Deployed: ${new Date().toISOString()}

#EXTINF:-1 tvg-id="hbo.us" tvg-name="HBO" tvg-logo="https://cdn.easyepg.tv/logos/hbo.png" group-title="Entertainment",HBO
https://example.com/hbo.m3u8

#EXTINF:-1 tvg-id="espn.us" tvg-name="ESPN" tvg-logo="https://cdn.easyepg.tv/logos/espn.png" group-title="Sports",ESPN
https://example.com/espn.m3u8
`;

      return new Response(m3u, {
        headers: {
          'Content-Type': 'audio/x-mpegurl; charset=utf-8',
          'Cache-Control': 'public, max-age=60, s-maxage=60',
          'ETag': `"${slug}-${Date.now()}"`,
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (err) {
      return new Response('Internal Error', { status: 500 });
    }
  },
};
