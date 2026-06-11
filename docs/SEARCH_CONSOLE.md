# Google Search Console Setup

## Recommended Property

Use a URL prefix property for:

```text
https://www.tradiabusiness.com
```

This matches the live production domain and works cleanly with the site's existing sitemap and meta-tag verification.

## Verification

Choose the HTML tag verification method in Google Search Console.

Google will show a tag like:

```html
<meta name="google-site-verification" content="verification-token-here" />
```

Copy only the `content` value and add it in Vercel:

```text
GOOGLE_SITE_VERIFICATION=verification-token-here
```

Add it to Production and Preview, then redeploy the project. The app will place it in the site head automatically.

## Sitemap

After verification, submit:

```text
https://www.tradiabusiness.com/sitemap.xml
```

Robots file:

```text
https://www.tradiabusiness.com/robots.txt
```

AdSense sellers file:

```text
https://www.tradiabusiness.com/ads.txt
```

## Notes

- Google can take time to crawl new pages and reflect indexing status.
- Public business, category, and location pages are already included in the dynamic sitemap.
- Admin, dashboard, and API routes are excluded from crawling in `robots.txt`.
