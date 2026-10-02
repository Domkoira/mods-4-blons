#!/usr/bin/env python3
"""Find local businesses that have a website, using free OpenStreetMap data.

Standard library only. Usage:
    python3 find_leads.py "Leeds, UK" plumber electrician dentist
    python3 find_leads.py "Austin, Texas" --all --out leads.csv

Writes a CSV (name,url,email,city,phone,category) that audit.py reads directly.
Run `python3 find_leads.py --list` to see the categories.
"""
import argparse
import csv
import json
import sys
import time
import urllib.parse
import urllib.request

UA = "site-audit-leadfinder/1.0 (small business outreach tool)"
NOMINATIM = "https://nominatim.openstreetmap.org/search"
OVERPASS = "https://overpass-api.de/api/interpreter"

# Trades that rarely have in-house web people and gain the most from local search.
CATEGORIES = {
    "plumber": "craft=plumber", "electrician": "craft=electrician", "roofer": "craft=roofer",
    "carpenter": "craft=carpenter", "painter": "craft=painter", "hvac": "craft=hvac",
    "gardener": "craft=gardener", "locksmith": "shop=locksmith", "dentist": "amenity=dentist",
    "vet": "amenity=veterinary", "physio": "healthcare=physiotherapist", "hairdresser": "shop=hairdresser",
    "beauty": "shop=beauty", "car_repair": "shop=car_repair", "florist": "shop=florist",
    "accountant": "office=accountant", "lawyer": "office=lawyer", "estate_agent": "office=estate_agent",
    "gym": "leisure=fitness_centre", "restaurant": "amenity=restaurant", "cafe": "amenity=cafe",
}

# Hosted profiles aren't sites the owner can fix; skip them.
SKIP_HOSTS = ("facebook.", "instagram.", "linktr.ee", "yell.com", "google.", "wix.com/", "business.site",
              "tripadvisor.", "yelp.", "checkatrade.", "twitter.", "x.com")


def get_json(url, data=None):
    req = urllib.request.Request(url, data=data, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.load(r)


def bbox_for(place):
    q = urllib.parse.urlencode({"q": place, "format": "json", "limit": 1})
    res = get_json(f"{NOMINATIM}?{q}")
    if not res:
        sys.exit(f"Couldn't find '{place}'. Try adding the country, e.g. 'Leeds, UK'.")
    s, n, w, e = res[0]["boundingbox"]
    return f"{s},{w},{n},{e}", res[0]["display_name"].split(",")[0]


def query(bbox, tags):
    parts = []
    for t in tags:
        k, v = t.split("=")
        for key in ("website", "contact:website"):
            parts.append(f'nwr["{k}"="{v}"]["{key}"]({bbox});')
    q = f"[out:json][timeout:170];({''.join(parts)});out tags;"
    return get_json(OVERPASS, urllib.parse.urlencode({"data": q}).encode())["elements"]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("place", nargs="?")
    ap.add_argument("categories", nargs="*")
    ap.add_argument("--all", action="store_true", help="use every category")
    ap.add_argument("--list", action="store_true", help="list categories and exit")
    ap.add_argument("--out", default="leads.csv")
    a = ap.parse_args()

    if a.list or not a.place:
        print("Categories:", ", ".join(CATEGORIES))
        return
    cats = list(CATEGORIES) if a.all else a.categories
    unknown = [c for c in cats if c not in CATEGORIES]
    if not cats or unknown:
        sys.exit(f"Unknown/missing categories {unknown}. Choose from: {', '.join(CATEGORIES)}")

    bbox, city = bbox_for(a.place)
    time.sleep(1)  # Nominatim usage policy: max 1 request/second
    tag_to_cat = {v: k for k, v in CATEGORIES.items()}
    elements = query(bbox, [CATEGORIES[c] for c in cats])

    rows, seen = [], set()
    for el in elements:
        t = el.get("tags", {})
        url = (t.get("website") or t.get("contact:website") or "").strip()
        name = t.get("name", "").strip()
        if not url or not name or any(h in url.lower() for h in SKIP_HOSTS):
            continue
        if t.get("brand") or t.get("brand:wikidata"):
            continue  # national chains have marketing teams
        if not url.startswith("http"):
            url = "https://" + url
        host = urllib.parse.urlparse(url).netloc.lower().removeprefix("www.")
        if host in seen:
            continue
        seen.add(host)
        cat = next((c for tag, c in tag_to_cat.items() if t.get(tag.split("=")[0]) == tag.split("=")[1]), "")
        rows.append({"name": name, "url": url, "email": t.get("email") or t.get("contact:email", ""),
                     "city": t.get("addr:city", city), "phone": t.get("phone") or t.get("contact:phone", ""),
                     "category": cat})

    with open(a.out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["name", "url", "email", "city", "phone", "category"])
        w.writeheader()
        w.writerows(rows)
    print(f"Found {len(rows)} independent businesses with websites in {city} -> {a.out}")


if __name__ == "__main__":
    main()
