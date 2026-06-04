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

      // Placeholder M3U matching real playlist format
      const m3u = `#EXTM3U
# EasyEPG — ${slug}
# Deployed: ${new Date().toISOString()}

#EXTINF:-1 tvg-id="bbc1.uk" tvg-name="BBC 1 HEVC HD" tvg-logo="https://logo.m3uassets.com/bbc1.png" group-title="GENERAL ʰᵉᵛᶜ",BBC 1 HEVC HD
http://pro.ukglobal.store/live/fcfae39ab4/adbb05ede5/852146.ts
#EXTINF:-1 tvg-id="bbc2.uk" tvg-name="BBC 2 HEVC HD" tvg-logo="https://logo.m3uassets.com/bbc2.png" group-title="GENERAL ʰᵉᵛᶜ",BBC 2 HEVC HD
http://pro.ukglobal.store/live/fcfae39ab4/adbb05ede5/852145.ts
#EXTINF:-1 tvg-id="itv1.uk" tvg-name="ITV 1 HEVC HD" tvg-logo="https://logo.m3uassets.com/itv1.png" group-title="GENERAL ʰᵉᵛᶜ",ITV 1 HEVC HD
http://pro.ukglobal.store/live/fcfae39ab4/adbb05ede5/852144.ts
#EXTINF:-1 tvg-id="channel4.uk" tvg-name="CHANNEL 4 HEVC HD" tvg-logo="https://logo.m3uassets.com/channel4.png" group-title="GENERAL ʰᵉᵛᶜ",CHANNEL 4 HEVC HD
http://pro.ukglobal.store/live/fcfae39ab4/adbb05ede5/852142.ts
#EXTINF:-1 tvg-id="skynews.uk" tvg-name="SKY NEWS HEVC HD" tvg-logo="https://logo.m3uassets.com/skynews.png" group-title="GENERAL ʰᵉᵛᶜ",SKY NEWS HEVC HD
http://pro.ukglobal.store/live/fcfae39ab4/adbb05ede5/852133.ts
#EXTINF:-1 tvg-id="skysportsfootball.uk" tvg-name="SKY SPORTS FOOTBALL ᴴᴰ ◉" tvg-logo="https://logo.m3uassets.com/skysportsfootball.png" group-title="SPORT ᴴᴰ",SKY SPORTS FOOTBALL ᴴᴰ ◉
http://pro.ukglobal.store/live/fcfae39ab4/adbb05ede5/852125.ts
#EXTINF:-1 tvg-id="skysportscricket.uk" tvg-name="SKY SPORTS CRICKET HD" tvg-logo="https://logo.m3uassets.com/skysportscricket.png" group-title="WORLD CRICKET",SKY SPORTS CRICKET HD
http://pro.ukglobal.store/live/fcfae39ab4/adbb05ede5/852117.ts
#EXTINF:-1 tvg-id="willowcricket.in" tvg-name="US: WILLOW CRICKET" tvg-logo="https://logo.m3uassets.com/willowcricket.png" group-title="WORLD CRICKET",US: WILLOW CRICKET
http://pro.ukglobal.store/live/fcfae39ab4/adbb05ede5/852116.ts
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
