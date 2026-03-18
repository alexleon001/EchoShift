/**
 * Share Routes — OG card metadata and share page for score challenges.
 *
 * GET /api/share?mode=endless&score=1234&combo=5&round=10&accuracy=95&player=Username
 *   → Returns an HTML page with Open Graph meta tags so links preview nicely on social media.
 *
 * GET /api/share/image?mode=endless&score=1234&combo=5&player=Username
 *   → Returns a dynamically generated SVG image for the OG card.
 */

import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';

interface ShareQuery {
  mode?: string;
  score?: string;
  combo?: string;
  round?: string;
  accuracy?: string;
  player?: string;
}

function getModeLabel(mode: string): string {
  switch (mode) {
    case 'blitz': return 'Blitz';
    case 'daily': return 'Daily';
    case 'duo': return 'Duo';
    default: return 'Endless';
  }
}

function getModeColor(mode: string): string {
  switch (mode) {
    case 'blitz': return '#ffd166';
    case 'daily': return '#f72585';
    case 'duo': return '#f72585';
    default: return '#00f5d4';
  }
}

/**
 * Generate an SVG OG card for a score share.
 */
function generateOGCardSVG(params: ShareQuery): string {
  const mode = params.mode ?? 'endless';
  const score = Number(params.score ?? 0);
  const combo = Number(params.combo ?? 0);
  const player = params.player ?? 'Anónimo';
  const round = Number(params.round ?? 0);
  const accuracy = Number(params.accuracy ?? 0);
  const modeLabel = getModeLabel(mode);
  const accent = getModeColor(mode);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#07080f"/>
      <stop offset="100%" stop-color="#0d0e1a"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <!-- Border -->
  <rect x="20" y="20" width="1160" height="590" rx="24" fill="none" stroke="${accent}" stroke-opacity="0.2" stroke-width="2"/>
  <!-- Accent circle -->
  <circle cx="600" cy="-200" r="500" fill="${accent}" fill-opacity="0.03"/>
  <!-- Title -->
  <text x="600" y="120" text-anchor="middle" font-family="system-ui, sans-serif" font-size="36" font-weight="900" fill="#fff" letter-spacing="12">ECHOSHIFT</text>
  <!-- Mode badge -->
  <rect x="510" y="145" width="180" height="36" rx="18" fill="${accent}" fill-opacity="0.15" stroke="${accent}" stroke-opacity="0.4"/>
  <text x="600" y="170" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="800" fill="${accent}" letter-spacing="6">${modeLabel.toUpperCase()}</text>
  <!-- Player name -->
  <text x="600" y="230" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="700" fill="#888">${escapeXml(player)}</text>
  <!-- Score -->
  <text x="600" y="330" text-anchor="middle" font-family="system-ui, sans-serif" font-size="96" font-weight="900" fill="#fff" filter="url(#glow)">${score.toLocaleString()}</text>
  <text x="600" y="365" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#555" letter-spacing="6">PUNTOS</text>
  <!-- Stats row -->
  <text x="250" y="450" text-anchor="middle" font-family="system-ui, sans-serif" font-size="40" font-weight="800" fill="${accent}">x${combo}</text>
  <text x="250" y="480" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#555" letter-spacing="3">COMBO</text>
  <text x="600" y="450" text-anchor="middle" font-family="system-ui, sans-serif" font-size="40" font-weight="800" fill="${accent}">${round}</text>
  <text x="600" y="480" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#555" letter-spacing="3">RONDAS</text>
  <text x="950" y="450" text-anchor="middle" font-family="system-ui, sans-serif" font-size="40" font-weight="800" fill="${accent}">${accuracy}%</text>
  <text x="950" y="480" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#555" letter-spacing="3">PRECISIÓN</text>
  <!-- CTA -->
  <text x="600" y="570" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="#444">¿Puedes superarlo?</text>
</svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const shareRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * OG card image — returns SVG.
   */
  fastify.get('/share/image', async (request: FastifyRequest<{ Querystring: ShareQuery }>, reply: FastifyReply) => {
    const svg = generateOGCardSVG(request.query);
    reply
      .header('Content-Type', 'image/svg+xml')
      .header('Cache-Control', 'public, max-age=86400')
      .send(svg);
  });

  /**
   * Share page — HTML with OG meta tags for rich link previews.
   */
  fastify.get('/share', async (request: FastifyRequest<{ Querystring: ShareQuery }>, reply: FastifyReply) => {
    const q = request.query;
    const mode = q.mode ?? 'endless';
    const score = Number(q.score ?? 0);
    const combo = Number(q.combo ?? 0);
    const player = escapeXml(q.player ?? 'Anónimo');
    const modeLabel = getModeLabel(mode);
    const round = Number(q.round ?? 0);
    const accuracy = Number(q.accuracy ?? 0);

    const title = `${player} — ${score.toLocaleString()} pts en ${modeLabel}`;
    const description = `x${combo} combo | Ronda ${round} | ${accuracy}% precisión. ¿Puedes superarlo?`;

    // Build image URL
    const imageParams = new URLSearchParams({
      mode,
      score: String(score),
      combo: String(combo),
      round: String(round),
      accuracy: String(accuracy),
      player: q.player ?? 'Anónimo',
    });
    const baseUrl = `${request.protocol}://${request.hostname}`;
    const imageUrl = `${baseUrl}/api/share/image?${imageParams.toString()}`;

    // Deep link for mobile
    const deepLink = `echoshift://challenge?${imageParams.toString()}`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>EchoShift — ${title}</title>
  <meta property="og:title" content="EchoShift — ${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="EchoShift — ${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #07080f; color: #fff; font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .card { text-align: center; padding: 40px; }
    h1 { font-size: 32px; letter-spacing: 8px; margin-bottom: 16px; }
    .score { font-size: 64px; font-weight: 900; color: #00f5d4; margin: 24px 0; }
    .cta { display: inline-block; background: #00f5d4; color: #07080f; font-weight: 800; padding: 14px 32px; border-radius: 12px; text-decoration: none; letter-spacing: 2px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>ECHOSHIFT</h1>
    <p>${player} te desafía en ${modeLabel}</p>
    <div class="score">${score.toLocaleString()}</div>
    <p>x${combo} combo · Ronda ${round} · ${accuracy}% precisión</p>
    <a class="cta" href="${deepLink}">ACEPTAR DESAFÍO</a>
  </div>
  <script>
    // Try to open the deep link on mobile
    setTimeout(function() { window.location.href = "${deepLink}"; }, 500);
  </script>
</body>
</html>`;

    reply.header('Content-Type', 'text/html').send(html);
  });
};
