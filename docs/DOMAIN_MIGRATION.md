# Tradia Domain Migration

## Target

- Canonical public URL: `https://www.tradiabusiness.com`
- Redirect source domains:
  - `https://tradiabusiness.com`
  - `https://tradia.business`
  - `https://www.tradia.business`

## Current Status

- `tradiabusiness.com` and `www.tradiabusiness.com` are attached to the Tradia Vercel project.
- Vercel reports that both new hostnames are verified but DNS is misconfigured.
- The domain uses Go54 nameservers: `nsc.go54.com` and `nsd.go54.com`.
- The migration code is prepared locally but must not be deployed until the new DNS records resolve.

## DNS Records To Add At Go54

Remove conflicting A, AAAA, or CNAME records for the same names before adding:

| Name | Type | Value |
| --- | --- | --- |
| `@` | `A` | `76.76.21.21` |
| `www` | `CNAME` | `cname.vercel-dns.com` |

Do not remove MX or email-related TXT records.

## Safe Cutover

1. Add the DNS records above at Go54.
2. Wait until Vercel shows both new domains as correctly configured.
3. Set Vercel's production `NEXTAUTH_URL` to `https://www.tradiabusiness.com`.
4. Deploy the prepared domain migration commit.
5. Confirm `https://www.tradiabusiness.com`, login, logout, API routes, and payments work.
6. Confirm every old-domain URL redirects to the matching new-domain path.
7. Add `https://www.tradiabusiness.com` to Google Search Console and submit `/sitemap.xml`.
8. Use Google Search Console's Change of Address tool for the old domain.
9. Update AdSense, Resend sender-domain verification, social profiles, and external directory links.

Changing domains starts a new browser cookie scope, so existing users should expect to log in once on the new domain.
