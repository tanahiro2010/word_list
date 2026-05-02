import { NextRequest, NextResponse } from 'next/server'

function truncate(s: string | null | undefined, n = 1000) {
  if (!s) return null
  return s.length > n ? s.slice(0, n) + '... (truncated)' : s
}

// Middleware that logs request location, method and headers.
// NOTE: Reading the request body in Next.js middleware consumes the stream
// and will make the body unavailable to downstream handlers. To avoid
// breaking routes, body logging is disabled by default. Enable by setting
// `ENABLE_MIDDLEWARE_BODY_LOG=1` in your environment if you understand the risk.
export function proxy(req: NextRequest) {
  try {
    // Basic info
    // eslint-disable-next-line no-console
    console.log('[middleware] ->', req.url)
    // eslint-disable-next-line no-console
    console.log('[middleware] method:', req.method)
    // eslint-disable-next-line no-console
    console.log('[middleware] headers:', Object.fromEntries(req.headers.entries()))

    // Optional body logging (opt-in to avoid consuming the stream accidentally)
    if (process.env.ENABLE_MIDDLEWARE_BODY_LOG === '1' && req.method !== 'GET' && req.method !== 'HEAD') {
      ;(async () => {
        try {
          const text = await req.text()
          // eslint-disable-next-line no-console
          console.log('[middleware] body:', truncate(text))
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log('[middleware] body: <unavailable>')
        }
      })()
    }
  } catch (e) {
    // ignore logging errors
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}
