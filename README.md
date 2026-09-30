# p1-jonathanng.net
## ChartMyFreedom calculator (`wealth/`)

Deployed with Cloudflare Workers static assets: `wrangler.jsonc` serves `wealth/` at the site root.

A single-file personal wealth planner. Open `wealth/index.html` in a browser (no build step).

- Enter take-home income, spending, savings, investments and debts.
- See when you reach financial independence (FI number = annual core spending ÷ withdrawal rate).
- Drag the "earn more / spend less" levers to see how many years each saves.
- Get a prioritized next-step checklist and an avalanche debt-payoff order.
- Print the page with your inputs, or email yourself a plain-text summary (opens your own email app via `mailto:`), or copy it.

The numbers you enter are never collected: there is no server-side storage, and data stays in your browser's localStorage. See `wealth/privacy.html` for the site Privacy Policy. Educational projection, not financial advice.

### Analytics and cookie consent

Both pages load Google Tag Manager (`GTM-5S8W6KMB`) and GA4 (`G-N48PR9J9NV`). `wealth/consent.js` must load before them: it sets Google Consent Mode v2 to *denied* by default for EEA/UK/Swiss visitors (by IP region, via the `region` parameter) and *granted* elsewhere, shows the cookie banner to visitors in a European time zone (Accept all / Reject all / Customize), saves the choice in localStorage, and pushes a `cookie_consent_update` event. Any element with `data-cookie-settings` reopens the banner.

### Ads

Both pages load Google AdSense (`ca-pub-5441763296362900`) after `consent.js`, so ad cookies follow the visitor's consent choice. `wealth/ads.txt` authorizes Google to sell ad space on the site and is served at `/ads.txt`.

### Cost-of-living pages

`scripts/build-cities.mjs` builds `/cost-of-living/` and one page per metro in `data/metros.json` (the 20 largest U.S. metro areas) from the U.S. Bureau of Economic Analysis Regional Price Parities, read through FRED. No API key is needed.

```sh
node scripts/build-cities.mjs            # fetch the latest data into data/rpp.json, then render
node scripts/build-cities.mjs --offline  # re-render from the saved data/rpp.json
```

It also writes `wealth/sitemap.xml` and `wealth/robots.txt`. BEA publishes new metro figures once a year (usually December); re-run the script after each release and commit the result.

