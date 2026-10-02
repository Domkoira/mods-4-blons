# Site Audit: website fixes for local businesses

Find small local businesses with weak websites, send each one a free report on what's wrong, and fix the issues for a flat fee ($199 by default). It's three Python scripts using only the standard library, so there's nothing to install beyond Python 3.9+.

```
find_leads.py  ->  leads.csv  ->  audit.py  ->  reports/ (one report + email per site)  ->  send.py
```

## One-time setup (about 20 minutes)

1. **Payment:** create a free [Stripe](https://stripe.com) account and make a **Payment Link** for $199 named "Website fixes". Keep the link handy.
2. **Email:** use a Gmail account (a new one is fine, e.g. `yourname.webfixes@gmail.com`). Turn on 2-step verification, then create an **App Password** at <https://myaccount.google.com/apppasswords>.
3. **Terminal:**
   ```bash
   export SMTP_USER="yourname.webfixes@gmail.com"
   export SMTP_PASS="the-16-char-app-password"
   ```
4. **Postal address:** the law requires one in every cold email (CAN-SPAM). A PO box or virtual mailbox works.

## Your daily routine (about 10 minutes)

```bash
# Day 1 only: pick a city and some trades (repeat with new ones whenever you run low)
python3 find_leads.py "Leeds, UK" plumber electrician roofer dentist hairdresser car_repair
python3 audit.py leads.csv --out reports --sender "Your Name"

# Every day:
python3 send.py reports --address "Your postal address" --sender "Your Name"          # preview
python3 send.py reports --address "Your postal address" --sender "Your Name" --send   # send 20
python3 send.py reports --address "Your postal address" --sender "Your Name" --followups --send
```

Then check your inbox:
- **Anyone who replies** (yes, no, or a question): add their email address to `reports/do_not_contact.txt` so they don't get the automatic follow-up.
- **"Yes" replies:** send template A below.
- **"No thanks" replies:** just add them to the list. Nothing else is needed.

`send.py` waits 45–120 seconds between emails, so a batch of 20 takes about 30 minutes. Leave it running.

## Reply templates

**A: they said yes**
> Great! To make the fixes I'll need a login for your website editor (WordPress, Wix, Squarespace, etc.). You can add me as a user with my email address so you don't have to share your password. Once everything's live I'll send a before/after summary and the payment link. Nothing is owed until you're happy.

**B: they ask "who are you?" or "is this a scam?"**
> Fair question! I'm an independent web developer based in [area]. The report is free and yours to keep whether or not you hire me, and you only pay after the fixes are live and you've checked them.

**C: fixes done**
> All done! Here's what changed: [list]. Your site now scores [new score]/100 (re-run report attached). Here's the payment link: [Stripe link]. Thanks for trusting me with it.

## Doing the fixes

Start a Claude session, paste in the client's report and tell it which platform the site runs on. It will give you click-by-click steps or the exact code to paste. Most fixes take 5–15 minutes each:

| Issue | Typical fix |
|---|---|
| No HTTPS | Turn on the host's free SSL (Let's Encrypt) and force the redirect |
| Not mobile-friendly | Add the viewport tag; on old themes, switch to a responsive theme |
| Missing title/description | SEO plugin (Yoast/RankMath) or the platform's SEO settings |
| Not tap-to-call | Wrap the phone number in `<a href="tel:...">` |
| No schema.org markup | Paste a LocalBusiness JSON-LD block |
| Broken links | Fix or redirect them |
| Old © year, favicon, alt text, sitemap | Settings or plugin |

Afterwards, re-run `python3 audit.py <their-url> --out after` to show them the improved score.

## Realistic numbers

Cold email to local businesses typically gets **1–3% "yes" replies**. At 20 new emails a day plus follow-ups:

| Emails sent | Expected clients | At $199 |
|---|---|---|
| 140 (1 week) | 1–4 | $200–$800 |
| 300 | 3–9 | $600–$1,800 |
| 500 | 5–15 | $1,000–$3,000 |

**$1,000 most likely takes 2–3 weeks, not one.** Ways to speed it up:
- **Upsell:** offer each client a $49/month care plan (updates, backups, monthly report). Three clients on that adds about $150/month in recurring income.
- **Raise the price** for sites with five or more critical issues (`--price 299`).
- **Get referrals:** ask every happy client, "Know another business owner who'd want a free check?"
- **Walk in:** visit local businesses with a printed report (open the `.html` file and press Ctrl+P). Face-to-face converts far better than email.

## Rules worth keeping

- Keep the 20/day limit, at least for the first 2 weeks. A new Gmail account that sends more gets flagged as spam, and then nothing reaches anyone.
- **UK/EU:** cold email to limited companies is allowed. Sole traders and partnerships need prior consent under PECR/GDPR, so contact those by phone or walk-in instead.
- Never pretend the email came from Google, their web host, or anyone you aren't.
- Only pitch what the report actually shows. `audit.py` skips any site it couldn't scan cleanly (bot protection, rate limits) instead of guessing.
