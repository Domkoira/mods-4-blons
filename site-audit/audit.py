#!/usr/bin/env python3
"""Local-business website audit: scans sites, writes a client-ready HTML
report per site, a leads CSV, and a personalised outreach email per site.

Standard library only. Usage:
    python3 audit.py leads.csv            # CSV with columns: name,url[,email,city]
    python3 audit.py https://example.com  # one or more URLs
Options:
    --out DIR      output folder (default: reports)
    --sender NAME  your name, used in the emails
    --price N      the fix-everything price quoted in reports/emails (default 149)
"""
import argparse
import csv
import datetime as dt
import html
import os
import re
import socket
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser

UA = "Mozilla/5.0 (compatible; SiteHealthCheck/1.0)"
TIMEOUT = 15
socket.setdefaulttimeout(TIMEOUT)


# ---------------------------------------------------------------- fetching

def fetch(url, method="GET", max_bytes=3_000_000):
    """Return (final_url, status, headers, body_bytes, seconds) or raise."""
    req = urllib.request.Request(url, method=method, headers={"User-Agent": UA})
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            body = r.read(max_bytes) if method == "GET" else b""
            return r.geturl(), r.status, dict(r.headers), body, time.time() - start
    except urllib.error.HTTPError as e:
        return url, e.code, dict(e.headers or {}), b"", time.time() - start


def status_of(url):
    """HEAD a link (falling back to GET). Returns status code or 0 on failure."""
    for method in ("HEAD", "GET"):
        try:
            _, status, _, _, _ = fetch(url, method=method, max_bytes=1024)
            if status not in (403, 405) or method == "GET":
                return status
        except Exception:
            if method == "GET":
                return 0
    return 0


# ---------------------------------------------------------------- parsing

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title, self._in_title = "", False
        self.meta = {}
        self.links, self.imgs, self.scripts = [], [], 0
        self.h1 = 0
        self.forms = 0
        self.has_favicon = False
        self.json_ld = []
        self._in_ld = False
        self.text = []

    def handle_starttag(self, tag, attrs):
        a = {k.lower(): (v or "") for k, v in attrs}
        if tag == "title":
            self._in_title = True
        elif tag == "meta":
            key = (a.get("name") or a.get("property") or "").lower()
            if key:
                self.meta[key] = a.get("content", "")
        elif tag == "a" and a.get("href"):
            self.links.append(a["href"])
        elif tag == "img":
            self.imgs.append(a)
        elif tag == "h1":
            self.h1 += 1
        elif tag == "form":
            self.forms += 1
        elif tag == "link" and "icon" in a.get("rel", "").lower():
            self.has_favicon = True
        elif tag == "script":
            self.scripts += 1
            if a.get("type", "").lower() == "application/ld+json":
                self._in_ld = True
                self.json_ld.append("")

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        elif tag == "script":
            self._in_ld = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._in_ld:
            self.json_ld[-1] += data
        else:
            self.text.append(data)


# ---------------------------------------------------------------- checks

def normalise(url):
    url = url.strip()
    if not re.match(r"^https?://", url, re.I):
        url = "https://" + url
    return url


def audit(url):
    """Run every check against url. Returns dict with issues and stats."""
    url = normalise(url)
    host = urllib.parse.urlparse(url).netloc
    issues = []  # (severity 1-3, title, plain-English impact)
    stats = {"url": url, "host": host}

    def add(sev, title, why):
        issues.append((sev, title, why))

    # HTTPS / reachability
    try:
        final, status, headers, body, secs = fetch(url)
    except (ssl.SSLError, urllib.error.URLError) as e:
        if isinstance(getattr(e, "reason", e), ssl.SSLError) or isinstance(e, ssl.SSLError):
            add(3, "Security certificate is broken",
                "Browsers show a full-page 'Not Secure' warning; most visitors leave immediately.")
        try:
            final, status, headers, body, secs = fetch("http://" + host)
        except Exception as e2:
            return {**stats, "error": f"Site unreachable: {e2}", "issues": [
                (3, "Website is down or unreachable",
                 "Anyone searching for the business sees an error instead of the site.")], "score": 0}
    except Exception as e:
        if "Tunnel connection failed" in str(e):
            return {**stats, "error": f"Your network/proxy blocked the scan: {e}", "issues": [], "score": None}
        return {**stats, "error": f"Site unreachable: {e}", "issues": [
            (3, "Website is down or unreachable",
             "Anyone searching for the business sees an error instead of the site.")], "score": 0}

    stats.update(final=final, status=status, load_seconds=round(secs, 2), kb=len(body) // 1024)
    if status in (401, 403, 429, 503):
        # Bot protection or rate limiting: the site may be fine for humans, so
        # never send a prospect a report built on a blocked scan.
        return {**stats, "error": f"Scan blocked (HTTP {status}); check this site manually",
                "issues": [], "score": None}
    if status >= 400:
        add(3, f"Homepage returns an error (HTTP {status})",
            "Visitors and Google see an error page instead of the business.")
    if not final.startswith("https://"):
        add(3, "No secure HTTPS connection",
            "Chrome labels the site 'Not Secure', which hurts trust and Google ranking.")
    if secs > 3:
        add(2 if secs < 6 else 3, f"Slow homepage ({secs:.1f}s to load the HTML alone)",
            "53% of mobile visitors leave a site that takes over 3 seconds to load.")
    if len(body) > 1_500_000:
        add(2, f"Very heavy homepage ({len(body)//1024} KB of HTML)",
            "Slow on mobile data and penalised by Google's speed checks.")

    charset = "utf-8"
    m = re.search(r"charset=([\w-]+)", headers.get("Content-Type", ""), re.I)
    if m:
        charset = m.group(1)
    page = body.decode(charset, errors="replace")
    p = PageParser()
    try:
        p.feed(page)
    except Exception:
        pass
    text = " ".join(p.text)

    # Search-engine basics
    title = p.title.strip()
    stats["title"] = title
    if not title:
        add(3, "Missing page title", "Google has nothing to show as the headline in search results.")
    elif len(title) < 15 or len(title) > 65:
        add(1, f"Page title is {'too short' if len(title) < 15 else 'too long'} ({len(title)} chars)",
            "Titles of 30-60 characters with the service and town get more clicks.")
    if not p.meta.get("description"):
        add(2, "Missing meta description",
            "Google writes its own snippet, often a random sentence, which lowers clicks.")
    if p.h1 == 0:
        add(1, "No main heading (H1) on the homepage",
            "Google and screen readers can't tell what the page is about.")
    if "viewport" not in p.meta:
        add(3, "Not mobile-friendly (no viewport tag)",
            "The site renders zoomed-out on phones, where most local searches happen.")
    if not p.has_favicon:
        add(1, "No favicon (browser tab icon)", "Looks unfinished in tabs, bookmarks and Google mobile results.")
    if not p.meta.get("og:title") and not p.meta.get("og:image"):
        add(1, "No social sharing preview",
            "Links shared on Facebook/WhatsApp show no image or proper title.")
    ld = " ".join(p.json_ld)
    if not re.search(r"LocalBusiness|Organization|Restaurant|Dentist|Plumber|Store|Service", ld):
        add(2, "No business info markup (schema.org)",
            "Google can't reliably show opening hours, address and reviews in search.")

    # Images
    no_alt = [i for i in p.imgs if not i.get("alt", "").strip()]
    if p.imgs and len(no_alt) / len(p.imgs) > 0.3:
        add(1, f"{len(no_alt)} of {len(p.imgs)} images have no description (alt text)",
            "Missed Google Images traffic and an accessibility problem.")

    # Contact / conversion
    hrefs = [h.strip() for h in p.links]
    has_tel = any(h.lower().startswith("tel:") for h in hrefs)
    has_mail = any(h.lower().startswith("mailto:") for h in hrefs)
    if not has_tel:
        add(2, "Phone number isn't tap-to-call",
            "Mobile visitors can't call with one tap; many won't copy the number by hand.")
    if not has_tel and not has_mail and p.forms == 0:
        add(3, "No obvious way to contact the business",
            "Visitors ready to buy have no easy way to get in touch.")

    # Stale copyright
    years = [int(y) for y in re.findall(r"(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})", text, re.I)]
    this_year = dt.date.today().year
    if years and max(years) < this_year - 1:
        add(1, f"Footer says © {max(years)}", "Makes the business look closed or neglected.")

    # robots / sitemap
    base = f"{urllib.parse.urlparse(final).scheme}://{urllib.parse.urlparse(final).netloc}"
    if status_of(base + "/sitemap.xml") >= 400 and status_of(base + "/sitemap_index.xml") >= 400:
        add(1, "No sitemap.xml", "Google discovers and indexes new pages more slowly.")

    # Broken links (sample up to 40)
    targets = []
    for h in hrefs:
        if h.startswith(("#", "mailto:", "tel:", "javascript:", "sms:")):
            continue
        absu = urllib.parse.urljoin(final, h).split("#")[0]
        if absu.startswith("http") and absu not in targets:
            targets.append(absu)
    targets = targets[:40]
    with ThreadPoolExecutor(8) as ex:
        codes = list(ex.map(status_of, targets))
    broken = [(u, c) for u, c in zip(targets, codes) if c == 404 or c >= 500 or c == 0]
    stats["links_checked"] = len(targets)
    if broken:
        add(2 if len(broken) < 3 else 3, f"{len(broken)} broken link(s) on the homepage",
            "Dead links frustrate visitors and signal a neglected site to Google.")
    stats["broken"] = broken

    issues.sort(key=lambda i: -i[0])
    penalty = sum({1: 3, 2: 6, 3: 12}[s] for s, _, _ in issues)
    return {**stats, "issues": issues, "score": max(10, 100 - penalty)}


# ---------------------------------------------------------------- output

SEV = {3: ("Critical", "#c0392b"), 2: ("Important", "#d68910"), 1: ("Minor", "#2e86c1")}


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:60] or "site"


def report_html(r, name, price, sender):
    rows = "".join(
        f"<tr><td><span class='tag' style='background:{SEV[s][1]}'>{SEV[s][0]}</span></td>"
        f"<td><b>{html.escape(t)}</b><br><span class='why'>{html.escape(w)}</span></td></tr>"
        for s, t, w in r["issues"])
    broken = "".join(f"<li>{html.escape(u)} &rarr; {c or 'no response'}</li>" for u, c in r.get("broken", []))
    score = r["score"]
    colour = "#27ae60" if score >= 80 else "#d68910" if score >= 55 else "#c0392b"
    today = dt.date.today().strftime("%d %B %Y")
    return f"""<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Website Health Report – {html.escape(name)}</title>
<style>
body{{font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:760px;margin:32px auto;padding:0 16px;color:#222;background:#fff}}
h1{{font-size:26px;margin-bottom:4px}} .sub{{color:#666;margin-top:0}}
.score{{display:inline-block;font-size:44px;font-weight:700;color:{colour};border:4px solid {colour};border-radius:50%;width:110px;height:110px;line-height:110px;text-align:center}}
table{{width:100%;border-collapse:collapse;margin:20px 0}} td{{padding:10px 8px;border-bottom:1px solid #eee;vertical-align:top}}
.tag{{color:#fff;padding:3px 8px;border-radius:4px;font-size:12px;white-space:nowrap}} .why{{color:#555;font-size:14px}}
.cta{{background:#f4f8fb;border-left:4px solid #2e86c1;padding:16px 20px;margin-top:28px}}
@media print{{body{{margin:0}}}}
</style></head><body>
<h1>Website Health Report</h1>
<p class="sub">{html.escape(name)} · {html.escape(r['host'])} · {today}</p>
<div class="score">{score}</div>
<p>Overall score out of 100. We found <b>{len(r['issues'])} issue(s)</b>
that may be costing {html.escape(name)} customers.</p>
<table>{rows or '<tr><td>No issues found. Great job!</td></tr>'}</table>
{f'<h3>Broken links found</h3><ul>{broken}</ul>' if broken else ''}
<div class="cta"><b>Want these fixed?</b><br>
I can fix every issue above for a flat <b>${price}</b>, usually within 48 hours,
with no ongoing contract. You only pay once the fixes are live.<br><br>
— {html.escape(sender)}</div>
</body></html>"""


def email_text(r, name, price, sender):
    top = [t for _, t, _ in r["issues"][:3]]
    bullets = "\n".join(f"  • {t}" for t in top)
    return f"""Subject: Quick note about the {name} website

Hi {name} team,

I ran a free health check on {r['host']} and it scored {r['score']}/100. The biggest issues:

{bullets}

These usually mean lost calls from people searching on their phones. I've attached the full report (free, yours to keep either way).

If you'd like, I can fix all of it for a flat ${price}, usually within 48 hours, and you only pay once it's done. Just reply "yes" and I'll get started.

Thanks,
{sender}

(If you'd rather not hear from me again, just reply "no thanks" and I won't follow up.)
"""


def load_targets(args):
    targets = []
    for a in args:
        if a.lower().endswith(".csv") and os.path.exists(a):
            with open(a, newline="", encoding="utf-8-sig") as f:
                for row in csv.DictReader(f):
                    row = {k.strip().lower(): (v or "").strip() for k, v in row.items() if k}
                    url = row.get("url") or row.get("website")
                    if url:
                        targets.append({"name": row.get("name") or urllib.parse.urlparse(normalise(url)).netloc,
                                        "url": url, "email": row.get("email", ""), "city": row.get("city", "")})
        else:
            targets.append({"name": urllib.parse.urlparse(normalise(a)).netloc, "url": a, "email": "", "city": ""})
    return targets


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("inputs", nargs="+")
    ap.add_argument("--out", default="reports")
    ap.add_argument("--sender", default="Your Name")
    ap.add_argument("--price", type=int, default=149)
    a = ap.parse_args()

    targets = load_targets(a.inputs)
    os.makedirs(a.out, exist_ok=True)
    summary = []

    def run(t):
        try:
            return t, audit(t["url"])
        except Exception as e:
            return t, {"url": t["url"], "host": t["url"], "error": str(e), "issues": [], "score": None}

    used = set()
    with ThreadPoolExecutor(4) as ex:
        for t, r in ex.map(run, targets):
            base, n = slug(t["name"]), 2
            while base in used:
                base, n = f"{slug(t['name'])}-{n}", n + 1
            used.add(base)
            if r.get("score") is not None:
                with open(os.path.join(a.out, base + ".html"), "w", encoding="utf-8") as f:
                    f.write(report_html(r, t["name"], a.price, a.sender))
                with open(os.path.join(a.out, base + ".email.txt"), "w", encoding="utf-8") as f:
                    f.write(email_text(r, t["name"], a.price, a.sender))
            crit = sum(1 for s, _, _ in r["issues"] if s == 3)
            summary.append({"name": t["name"], "email": t["email"], "city": t["city"], "url": t["url"],
                            "score": r.get("score"), "issues": len(r["issues"]), "critical": crit,
                            "top_issue": r["issues"][0][1] if r["issues"] else "",
                            "report": base + ".html", "error": r.get("error", "")})
            print(f"{(r.get('score') if r.get('score') is not None else '--'):>4}  "
                  f"{len(r['issues']):>2} issues  {t['name']}", file=sys.stderr)

    # Worst sites first: those are the warmest leads.
    summary.sort(key=lambda s: (s["score"] is None, s["score"] if s["score"] is not None else 999))
    with open(os.path.join(a.out, "leads.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(summary[0].keys()) if summary else ["name"])
        w.writeheader()
        w.writerows(summary)
    print(f"\nWrote {len(summary)} report(s) and leads.csv to {a.out}/", file=sys.stderr)


if __name__ == "__main__":
    main()
