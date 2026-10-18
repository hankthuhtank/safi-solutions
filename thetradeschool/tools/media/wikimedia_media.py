#!/usr/bin/env python3
"""Small build-time Wikimedia Commons media helper for TradeSchool.

No third-party packages required. This is intentionally not called by the website at
runtime: media selection should be reviewed for relevance and license before commit.
"""

from __future__ import annotations
import argparse
import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://commons.wikimedia.org/w/api.php"
UA = os.environ.get("TRADESCHOOL_USER_AGENT", "").strip()


def require_ua() -> str:
    if not UA:
        raise SystemExit(
            "Set TRADESCHOOL_USER_AGENT to a descriptive value with contact/repository info.\n"
            "Example: TradeSchoolMedia/1.0 (https://github.com/YOURNAME/YOURREPO)"
        )
    return UA


def clean(value: str | None) -> str:
    if not value:
        return ""
    value = html.unescape(value)
    value = re.sub(r"<[^>]+>", "", value)
    return re.sub(r"\s+", " ", value).strip()


def api(params: dict) -> dict:
    params = {**params, "format": "json", "formatversion": 2, "origin": "*"}
    req = urllib.request.Request(
        API + "?" + urllib.parse.urlencode(params),
        headers={"User-Agent": require_ua()},
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)


def rows_from(data: dict):
    for page in data.get("query", {}).get("pages", []):
        info = (page.get("imageinfo") or [{}])[0]
        md = info.get("extmetadata", {})
        yield {
            "title": page.get("title", ""),
            "description": clean(md.get("ImageDescription", {}).get("value")),
            "artist": clean(md.get("Artist", {}).get("value")),
            "license": clean(md.get("LicenseShortName", {}).get("value")),
            "license_url": clean(md.get("LicenseUrl", {}).get("value")),
            "source_page": "https://commons.wikimedia.org/wiki/"
            + urllib.parse.quote(page.get("title", "").replace(" ", "_")),
            "url": info.get("url", ""),
            "thumburl": info.get("thumburl", info.get("url", "")),
        }


def search(query: str, limit: int):
    data = api(
        {
            "action": "query",
            "generator": "search",
            "gsrsearch": query,
            "gsrnamespace": 6,
            "gsrlimit": max(1, min(limit, 20)),
            "prop": "imageinfo",
            "iiprop": "url|extmetadata",
            "iiurlwidth": 1200,
            "iiextmetadatafilter": "ImageDescription|Artist|LicenseShortName|LicenseUrl",
        }
    )
    rows = list(rows_from(data))
    if not rows:
        print("No Commons files found.")
        return
    for i, row in enumerate(rows, 1):
        print(f"\n[{i}] {row['title']}")
        print(f"    {row['description'][:240]}")
        print(f"    creator: {row['artist'] or 'not supplied'}")
        print(f"    license: {row['license'] or 'REVIEW SOURCE PAGE'}")
        if row["license_url"]:
            print(f"    license URL: {row['license_url']}")
        print(f"    source: {row['source_page']}")
        print(f"    preview: {row['thumburl']}")


def exact_file(title: str) -> dict:
    if not title.lower().startswith("file:"):
        title = "File:" + title
    data = api(
        {
            "action": "query",
            "titles": title,
            "prop": "imageinfo",
            "iiprop": "url|extmetadata",
            "iiurlwidth": 1800,
            "iiextmetadatafilter": "ImageDescription|Artist|LicenseShortName|LicenseUrl",
        }
    )
    rows = list(rows_from(data))
    if not rows or not rows[0]["url"]:
        raise SystemExit(f"Could not resolve {title!r}")
    return rows[0]


def download(title: str, output: str):
    row = exact_file(title)
    print(
        json.dumps(
            {
                k: row[k]
                for k in ("title", "description", "artist", "license", "license_url", "source_page")
            },
            indent=2,
        )
    )
    print("\nReview the metadata above and the source page before committing the file.")
    target = Path(output)
    target.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(row["url"], headers={"User-Agent": require_ua()})
    with urllib.request.urlopen(req, timeout=60) as response, target.open("wb") as f:
        f.write(response.read())
    print(f"Saved: {target}")


def main():
    parser = argparse.ArgumentParser(
        description="Search/download reviewed Wikimedia Commons media for TradeSchool"
    )
    sub = parser.add_subparsers(dest="command", required=True)
    s = sub.add_parser("search")
    s.add_argument("query")
    s.add_argument("--limit", type=int, default=6)
    d = sub.add_parser("download")
    d.add_argument("title", help="Exact Commons file title, e.g. 'File:Mcc room.jpg'")
    d.add_argument("output")
    args = parser.parse_args()
    if args.command == "search":
        search(args.query, args.limit)
    else:
        download(args.title, args.output)


if __name__ == "__main__":
    main()
