import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side API proxy: forwards /api/search/:plate to the Python backend.
 * This avoids cross-origin / SSL issues since the browser never leaves lp.baileytv.tech.
 *
 * In Docker the backend container is reachable at http://backend:8000 (service name).
 * For local development, fall back to http://localhost:8000.
 */
const BACKEND_BASE =
  process.env.INTERNAL_BACKEND_URL?.replace(/\/+$/, '') ||
  (process.env.NODE_ENV === 'production' ? 'http://backend:8000' : 'http://localhost:8000');

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ plate: string }> }
) {
  const { plate } = await params;

  try {
    const upstream = await fetch(
      `${BACKEND_BASE}/api/search/${encodeURIComponent(plate)}`,
      { cache: 'no-store' }
    );

    // Forward the upstream status and body as-is
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('Content-Type') || 'application/json' },
    });
  } catch (err) {
    console.error('[api/search proxy] upstream error:', err);
    return NextResponse.json(
      { detail: 'Backend unreachable' },
      { status: 502 }
    );
  }
}
