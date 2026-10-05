const BOT_USER_AGENTS = [
  'facebookexternalhit',
  'twitterbot',
  'whatsapp',
  'telegrambot',
  'linkedinbot',
  'slackbot',
  'discordbot',
  'pinterest',
  'skypeuripreview',
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    const backendUrl = env.BACKEND_URL || 'https://api-railway.ticketer.website';

    // 1. Intercept Sitemap
    if (url.pathname === '/sitemap.xml') {
      const res = await fetch(`${backendUrl}/api/sitemap.xml`);
      const body = await res.text();
      return new Response(body, {
        status: res.status,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // 2. Intercept Bot requests to Event pages
    const eventMatch = url.pathname.match(/^\/events\/([^/]+)\/?$/);
    if (eventMatch) {
      const isBot = BOT_USER_AGENTS.some((bot) =>
        userAgent.toLowerCase().includes(bot)
      );

      if (isBot) {
        const slug = eventMatch[1];
        const res = await fetch(`${backendUrl}/api/events/${slug}/meta`);
        const body = await res.text();
        return new Response(body, {
          status: res.status,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    }

    // 3. Fallback: Serve static assets (React SPA)
    return env.ASSETS.fetch(request);
  },
};
