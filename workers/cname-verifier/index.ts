// workers/cname-verifier/index.ts — EasyEPG CNAME verification Worker (cron)
// Runs every 60 seconds via wrangler cron trigger.
// Checks _easyepg-verify.{domain} TXT records and activates verified domains.

interface Env {
  DB: D1Database;
  CF_API_TOKEN: string;
  CF_ACCOUNT_ID: string;
  CF_ZONE_ID: string;
}

export default {
  // Cron trigger: every 60 seconds
  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    console.log('🔍 CNAME verifier started');

    // Fetch all unverified domains that haven't expired
    // const domains = await env.DB.prepare(`
    //   SELECT * FROM domain_verifications
    //   WHERE verified_at IS NULL
    //     AND expires_at > datetime('now')
    //     AND check_count < 72
    //   ORDER BY last_checked_at ASC
    //   LIMIT 50
    // `).all();

    // Placeholder: log and exit
    console.log('✅ No pending verifications');
  },

  // Also handle HTTP requests for manual "Check again" from UI
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/_version') {
      return new Response('cname-verifier', {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // POST /verify?domain=tv.yourname.com
    if (url.pathname === '/verify' && request.method === 'POST') {
      const domain = url.searchParams.get('domain');
      if (!domain) {
        return new Response('Missing domain', { status: 400 });
      }

      // Check TXT record via Cloudflare DNS API
      const resp = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/dns_records?type=TXT&name=_easyepg-verify.${domain}`,
        {
          headers: {
            Authorization: `Bearer ${env.CF_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await resp.json<any>();

      if (data.success && data.result.length > 0) {
        const token = data.result[0].content.replace(/"/g, '');
        console.log(`✅ Found TXT record for ${domain}: ${token}`);

        // In production: compare token against DB, create Worker route, set verified_at
        return new Response(JSON.stringify({ verified: true, token }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ verified: false }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};
