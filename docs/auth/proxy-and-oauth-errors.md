# Auth network configuration: client IPs and OAuth errors

Better Auth runs behind the API server in `backend/src/index.ts`. Two pieces of
its configuration depend on the deployment topology:

1. **Client IP resolution** decides which rate-limit bucket a request uses.
2. **OAuth error redirects** decide where a failed Google flow lands.

The application now resolves both from environment variables in
`backend/src/auth-settings.ts`. This document explains the defaults, how to
choose values for your edge, and what can go wrong.

## 1. Accurate rate limiting behind a proxy or CDN

### Why the default is not enough

Better Auth keys its rate limiter by client IP. Behind a reverse proxy or CDN,
the TCP peer is the edge server, not the customer. If the app ignores the
forwarded address, every customer shares one bucket and one abusive client can
throttle everyone.

Better Auth 1.7 supports two safe ways to resolve the address:

- Read a **single header your edge overwrites** with the real client IP, such
  as `cf-connecting-ip`, `x-real-ip`, or `x-vercel-forwarded-for`.
- Read a forwarded chain only when you list the **proxy hops** in
  `AUTH_TRUSTED_PROXIES`. Better Auth walks the chain from right to left, skips
  the trusted hops, and uses the first untrusted address.

Without trusted proxies, Better Auth trusts only a **single-value** forwarded
header. It deliberately refuses a comma-separated chain because the leftmost
value is client-controlled when a proxy appends instead of overwriting.

### Configuration

`backend/.env.example` documents the two variables:

```dotenv
AUTH_IP_ADDRESS_HEADERS=x-forwarded-for
AUTH_TRUSTED_PROXIES=
```

- `AUTH_IP_ADDRESS_HEADERS` is a comma-separated preference list. The default
  is `x-forwarded-for`.
- `AUTH_TRUSTED_PROXIES` is a comma-separated list of proxy IPs or CIDR
  ranges. Leave it empty when the selected header already contains one
  trustworthy address.
- Both values are validated at startup. A malformed header name, proxy IP, or
  CIDR range fails the process instead of silently falling back to a shared
  bucket.

### Choose the value for your edge

| Deployment | Recommended header | Notes |
| --- | --- | --- |
| Cloudflare | `cf-connecting-ip` | Lock the origin so it only accepts Cloudflare traffic, and make sure Cloudflare overwrites the header. |
| Vercel | `x-vercel-forwarded-for` | Vercel sets this at the edge. Do not also trust arbitrary client-supplied headers. |
| nginx | `x-real-ip` | Set `proxy_set_header X-Real-IP $remote_addr;` and overwrite `X-Forwarded-For` if you use it. |
| AWS ALB / generic reverse proxy | `x-forwarded-for` | If the chain has multiple hops, set `AUTH_TRUSTED_PROXIES` to the load balancer subnets. |
| Local development | `x-forwarded-for` (default) | Better Auth falls back to `127.0.0.1` in development, so no proxy is required. |

Examples:

```dotenv
# Cloudflare
AUTH_IP_ADDRESS_HEADERS=cf-connecting-ip

# nginx
AUTH_IP_ADDRESS_HEADERS=x-real-ip

# Vercel
AUTH_IP_ADDRESS_HEADERS=x-vercel-forwarded-for

# Multi-hop proxy chain (only these hops are trusted)
AUTH_IP_ADDRESS_HEADERS=x-forwarded-for
AUTH_TRUSTED_PROXIES=192.0.2.10,10.0.0.0/24
```

### Step-by-step deployment

1. **Identify the edge.** Find the component that terminates TLS and forwards
   requests to the Node server.
2. **Make the edge authoritative.** Configure it to overwrite (not merely
   append to) the selected IP header. If you cannot overwrite, use
   `AUTH_TRUSTED_PROXIES` and list only the actual proxy addresses or subnets.
3. **Block direct access to the origin.** Rate limiting cannot protect you if a
   client can bypass the proxy and send its own IP header. Restrict the origin
   to the proxy's egress addresses or use a private network.
4. **Set the environment values.** Use one header the edge controls. Do not
   list several unrelated headers "just in case"; a client can set a header
   the edge does not overwrite.
5. **Set `NODE_ENV=production`.** Better Auth's rate limiter is on by default
   only in production mode. Local development and the Playwright suite leave it
   off so they can sign in repeatedly.
6. **Verify the warning is gone.** On a production-like run, Better Auth logs
   `Rate limiting could not determine a client IP...` when it has to fall back
   to a single shared bucket. If that appears, the header name or proxy chain
   does not match the deployment.
7. **Test from two networks.** Confirm that two different client addresses do
   not consume one another's budget, and that requests from one address do hit
   `429` after the configured limit.
8. **Monitor.** Track `429` responses and the auth error rate after changing
   the edge configuration.

### Risks and limitations

- **Header spoofing.** `x-forwarded-for`, `x-real-ip`, and similar headers are
  just request headers. They are only trustworthy when the origin is reachable
  exclusively through a proxy that sets or sanitizes them.
- **Over-broad proxy ranges.** Trusting a whole private range (for example
  `10.0.0.0/8`) can accidentally treat clients as proxies. List the narrowest
  proxy subnet that covers the deployment.
- **Multiple instances.** The default rate-limit storage is in-memory, so each
  Node process has its own counters. If the backend scales horizontally,
  configure a shared Better Auth rate-limit store (for example Redis or the
  database) as a separate change.
- **IPv6.** Better Auth normalizes IPv6 and rate-limits by `/64` by default, so
  rotating addresses inside one residential prefix does not bypass the limit.
  Override `ipv6Subnet` only if the deployment's allocation model requires it.
- **Development fallback.** In development and test, Better Auth falls back to
  `127.0.0.1`. That is convenient locally and not representative of production
  behavior; always verify with `NODE_ENV=production` and the real edge.

## 2. OAuth errors go to the app, not Better Auth's development page

### What changed

`backend/src/auth.ts` now sets:

```ts
onAPIError: {
  errorURL: `${FRONTEND_ORIGIN}/auth/error`,
}
```

The URL is absolute because the API and SPA can be separate origins. A
root-relative `/auth/error` would be resolved by the browser against the API
origin and miss the React route.

The frontend adds a public `/auth/error` route
(`frontend/src/pages/auth/AuthError.tsx`). It maps Better Auth's `error` code
through the existing `oauthError()` messages, shows an accessible alert, and
offers "Try signing in again" and "Go home" actions.

For failures inside a specific Google flow, `SignInForm.tsx` already sends
`errorCallbackURL` to the current sign-in URL (preserving `next`). Those errors
continue to appear inline on the sign-in page. The global `onAPIError.errorURL`
is the safety net for failures that happen before or outside that flow, such as
an invalid callback or a missing/expired state.

### Step-by-step verification

1. Set `FRONTEND_ORIGIN` to the public SPA origin in the deployed backend.
2. Confirm the SPA serves `/auth/error` (the React router handles it; a static
   host should fall back to `index.html` for client-side routes).
3. Request `GET /api/auth/error?error=access_denied&error_description=test`
   from the API origin. It should return `302` with a `Location` on the
   frontend origin, not Better Auth's built-in HTML page.
4. Open that `Location` and confirm the message and actions render.
5. Cancel a Google sign-in and confirm the per-flow `errorCallbackURL` lands
   back on `/signin` with the error visible inline.
6. Check the production logs for accidental redirects to `localhost`.

### Risks

- **Wrong `FRONTEND_ORIGIN`.** The error redirect would send users to the wrong
  host. Validate this value in deployment configuration and keep it aligned
  with CORS and `trustedOrigins`.
- **Open redirects.** `errorURL` comes from server configuration, not from
  request input. Do not replace it with a query parameter or other
  client-controlled value.
- **Reflected descriptions.** The page displays `error_description` as text
  (React escapes it), but treat that text as untrusted content. Do not render
  it as HTML or use it to build links.
- **Client-side routing on static hosts.** If `/auth/error` is requested
  directly, the static host must serve the SPA shell. Otherwise the backend
  redirect is correct but the user gets a host-level 404.

## Deployment checklist

- [ ] `FRONTEND_ORIGIN` is the public SPA origin, with no trailing path.
- [ ] The edge overwrites `AUTH_IP_ADDRESS_HEADERS` with the real client IP.
- [ ] `AUTH_TRUSTED_PROXIES` contains only real proxy hops, or is empty.
- [ ] The origin is not directly reachable by clients.
- [ ] `NODE_ENV=production` is set.
- [ ] No `Rate limiting could not determine a client IP` warning appears.
- [ ] `/api/auth/error` redirects to the SPA's `/auth/error`.
- [ ] Google cancellation returns to `/signin` with the inline message.
- [ ] Two client networks produce independent rate-limit buckets.

## References

- [Better Auth rate limit and IP detection](https://better-auth.com/docs/concepts/rate-limit)
- [Better Auth options: `advanced.ipAddress` and `onAPIError`](https://better-auth.com/docs/reference/options)
- [Better Auth OAuth error handling](https://better-auth.com/docs/concepts/oauth)
- [Better Auth 1.7 documentation index](https://better-auth.com/docs/llms.txt)
