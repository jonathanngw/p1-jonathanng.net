# p1-jonathanng.net
## Freedom Ledger (`wealth/`)

A single-file personal wealth planner. Open `wealth/index.html` in a browser (no build step).

- Enter take-home income, spending, savings, investments and debts.
- See when you reach financial independence (FI number = annual core spending ÷ withdrawal rate).
- Drag the "earn more / spend less" levers to see how many years each saves.
- Get a prioritized next-step checklist and an avalanche debt-payoff order.
- Print the page with your inputs, or email yourself a plain-text summary (opens your own email app via `mailto:`), or copy it.

The numbers you enter are never collected: there is no server-side storage, and data stays in your browser's localStorage. See `wealth/privacy.html` for the site Privacy Policy. Educational projection, not financial advice.

### Analytics and cookie consent

Both pages load Google Tag Manager (`GTM-5S8W6KMB`) and GA4 (`G-N48PR9J9NV`). `wealth/consent.js` must load before them: it sets Google Consent Mode v2 to *denied* by default, shows the cookie banner (Accept all / Reject all / Customize), saves the choice in localStorage, and pushes a `cookie_consent_update` event. Any element with `data-cookie-settings` reopens the banner.
