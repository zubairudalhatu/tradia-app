# Google AdSense Placements

The global AdSense script is already loaded in the site head.

Ad slots are optional and controlled by Vercel environment variables. If a slot variable is empty, that ad section does not render.

## Environment Variables

Use these in Vercel after creating display ad units inside Google AdSense:

```text
NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT=ca-pub-5482232753323076
NEXT_PUBLIC_ADSENSE_HOME_SLOT=your-homepage-ad-slot-id
NEXT_PUBLIC_ADSENSE_DIRECTORY_SLOT=your-directory-ad-slot-id
NEXT_PUBLIC_ADSENSE_BUSINESS_PROFILE_SLOT=your-business-profile-ad-slot-id
```

Add them to Production and Preview, then redeploy.

## Current Placements

- Homepage: below the hero/search area and before category links.
- Business directory: above listing cards.
- Business profile: below the main business profile panel and before reviews/enquiry.

## Notes

- Google may show blank space while a site or ad unit is still under review.
- Keep ad density modest so business discovery remains the main experience.
