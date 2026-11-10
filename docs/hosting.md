# Hosting and launch

Recommended: Cloudflare Workers Free. Keep domain registration at MijnDomein. Static asset requests are free; Workers Free includes 100,000 dynamic requests/day. This configuration runs the Worker first for all requests to ensure authentication cannot be bypassed. Stay on the Free plan; no paid storage/database is required. The domain and existing email subscription remain separate costs.

Sources checked 10 November 2026:
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/

## What is protected

The Worker protects all five `/proof-of-work/...` pages and `/assets/work/*`. Case HTML is bundled into the Worker and never placed in the public build directory. Server-signed, Secure/HttpOnly cookies expire after eight hours. Changing either secret invalidates existing sessions. Five login attempts per minute per IP per Cloudflare location are allowed; this rate limit is approximate, not a global lockout. Login submissions must come from the same origin. Case responses and images are never publicly cached. Missing secrets fail closed.

The repository is currently public: its source and Git history, including case images and previous password hashes, remain readable on GitHub. Make the repo private if the underlying material must be confidential. The old production CDN URLs are also outside this Worker's access control. This configuration protects the new website; it cannot retroactively hide copies on GitHub or the former CDN.

## First deployment

1. Merge the reviewed pull request. Create a Cloudflare account, choose the Free plans, and connect this GitHub repo through Workers & Pages > Create application > Connect Git repository.
2. Set the build command to `pnpm run build` and deploy command to `pnpm exec wrangler deploy`. The project root is the repository root; `wrangler.jsonc` specifies `dist` as the only public asset directory. Do not deploy the repository root as a static site and do not enable GitHub Pages.
3. In the Worker settings, add **encrypted secrets** named `CASE_PASSWORD` and `SESSION_SECRET`. Enter the agreed password into `CASE_PASSWORD`; generate a random `SESSION_SECRET` of at least 32 characters. No real secrets belong in source control, build variables exposed to the browser, or chat logs. Do not use the example test password.
4. Deploy a new version and test the workers.dev preview: open a direct case URL in a private browser window; it should show Login, never the case. Sign in, inspect a case and image, and test all five URLs. Secrets and rate limiting must also be verified on the deployed Cloudflare runtime.
5. Add `lbrty.nl` to Cloudflare DNS on the Free plan. Copy all existing DNS records, particularly MX/TXT records for email, before changing anything. Domain registration stays with MijnDomein. Change the domain's nameservers at MijnDomein to the pair supplied by Cloudflare. Preserve DNSSEC correctly: remove an old DS record before the nameserver switch if enabled, then enable Cloudflare DNSSEC and use the new DS record. Wait for the zone to be Active.
6. In the Worker's Settings > Domains & Routes, add `lbrty.nl` and `www.lbrty.nl` as Custom Domains. Replace only conflicting website records. Do not delete mail records. Verify HTTPS and that both hostnames serve the new site.
7. Recheck `ask@lbrty.nl` reception and Adobe Fonts' allowed domains, then check all five old production URLs. Keep the previous hosting available until this check passes; only then cancel any old hosting subscription.

No deployment, subscription purchase, domain transfer or DNS changes have been performed by this change.

## Local development and tests

Requires Node.js 22 or later and pnpm (Python is not needed):

```sh
pnpm install --frozen-lockfile
pnpm test
```

Create an ignored `.dev.vars` file for local `wrangler dev` with CASE_PASSWORD and SESSION_SECRET. Then run `pnpm run dev`. A plain static file server does not run authentication or production routing and must not be used to assess protection.

The automated tests cover direct URLs, HEAD, login success/failure, session signature/expiry/password rotation, cookie flags, private image access, path encoding/traversal, legacy URL redirects, cross-origin submissions, rate limiting, safe redirect targets and the build boundary.

## URL map

| Existing production URL | Served case |
| --- | --- |
| `/proof-of-work/spruit` | Spruit |
| `/proof-of-work/royal-floraholland` | Royal Flora Holland |
| `/proof-of-work/nefit-bosch` | Nefit Bosch |
| `/proof-of-work/gitp` | GITP |
| `/proof-of-work/bna` | BNA |

Legacy `/cases/*.html` links and trailing-slash/HTML aliases redirect to the matching production URL before the authentication check. All website email links use ask@lbrty.nl. No extra pages or mobile dropdown menu are added.
