# Tradia Domain Migration

## Target

- Canonical public URL: `https://www.tradiabusiness.com`
- Redirect source domains:
  - `https://tradiabusiness.com`
  - `https://tradia.business`
  - `https://www.tradia.business`

## Current Status

- `tradiabusiness.com` and `www.tradiabusiness.com` are attached to the Tradia Vercel project.
- Both new hostnames resolve to Vercel and the migration was deployed on 2026-06-11.
- `https://www.tradiabusiness.com` is live with the new canonical metadata, sitemap, login, logout, directory, and health endpoint.
- The domain uses Go54 nameservers: `nsc.go54.com` and `nsd.go54.com`.
- Google Public DNS currently reports `tradia.business` and `www.tradia.business` as NXDOMAIN. Restore their Vercel DNS records so old backlinks and Google results can reach the permanent redirects.

## DNS Records To Add At Go54

Remove conflicting A, AAAA, or CNAME records for the same names before adding:

| Name | Type | Value |
| --- | --- | --- |
| `@` | `A` | `76.76.21.21` |
| `www` | `CNAME` | `cname.vercel-dns.com` |

Do not remove MX or email-related TXT records.

The old `tradia.business` DNS zone also needs the same Vercel records while the redirect migration is active:

| Name | Type | Value |
| --- | --- | --- |
| `@` | `A` | `76.76.21.21` |
| `www` | `CNAME` | `cname.vercel-dns.com` |

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
