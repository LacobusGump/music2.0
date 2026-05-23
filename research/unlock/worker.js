// ═══════════════════════════════════════════════════════════
// GUMP Gate Worker — deploy to Cloudflare Workers
// Routes: /research/unlock/ and /research/gate-verify/
//
// Setup:
// 1. Create Worker in Cloudflare dashboard
// 2. Paste this code
// 3. Add env var: STRIPE_SECRET = sk_live_...
// 4. Set route: begump.com/research/unlock/*
//              begump.com/research/gate-verify/*
// ═══════════════════════════════════════════════════════════

const COOKIE_NAME = 'gump_paid';
const COOKIE_VALUE = 'aXNhYWM';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const ALLOWED_ORIGIN = 'https://begump.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── Verify endpoint (AJAX from unlock page) ──
    if (url.pathname.startsWith('/research/gate-verify/')) {
      const sessionId = url.searchParams.get('session_id');
      if (!sessionId) {
        return json({ paid: false });
      }
      const paid = await verifyStripe(sessionId, env.STRIPE_SECRET);
      if (paid) {
        return json({ paid: true }, {
          'Set-Cookie': cookie(COOKIE_NAME, COOKIE_VALUE, COOKIE_MAX_AGE),
        });
      }
      return json({ paid: false });
    }

    // ── Unlock redirect (Stripe success_url) ──
    if (url.pathname.startsWith('/research/unlock/')) {
      const sessionId = url.searchParams.get('session_id');
      if (sessionId) {
        const paid = await verifyStripe(sessionId, env.STRIPE_SECRET);
        if (paid) {
          return redirect('https://begump.com/research/unlock/', {
            'Set-Cookie': cookie(COOKIE_NAME, COOKIE_VALUE, COOKIE_MAX_AGE),
          });
        }
      }
      return redirect('https://begump.com/research/unlock/');
    }

    return fetch(request);
  }
};

async function verifyStripe(sessionId, stripeKey) {
  try {
    const r = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
      { headers: { Authorization: `Bearer ${stripeKey}` } }
    );
    const s = await r.json();
    return s.payment_status === 'paid';
  } catch {
    return false;
  }
}

function json(data, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

function redirect(location, extraHeaders = {}) {
  return new Response(null, {
    status: 302,
    headers: { Location: location, 'Cache-Control': 'no-store', ...extraHeaders },
  });
}

function cookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; Secure; SameSite=Lax`;
}
