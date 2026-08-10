#!/usr/bin/env python3
"""Create / update Word Wheel Quest Google Play one-time products (mirrors iOS IAP IDs).

Requires: fastlane/play-store-service-account.json with Android Publisher access.

  python3 scripts/create-play-iap-products.py
"""

from __future__ import annotations

import time
from pathlib import Path

import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account

ROOT = Path(__file__).resolve().parents[1]
KEY = ROOT / "fastlane" / "play-store-service-account.json"
PACKAGE = "com.puzint.wordwheel.app"
REGIONS_VERSION = "2025/03"

# Match src/constants/store.js + iOS twin
PRODUCTS = [
    {
        "productId": "word_wheel_pack_starter",
        "title": "Starter Fun Bundle",
        "description": "Jumpstart your journey with extra coins!",
        "usd": (3, 990_000_000),
    },
    {
        "productId": "word_wheel_pack_medium",
        "title": "Classic Challenge",
        "description": "Fuel your brain and conquer tough levels.",
        "usd": (1, 990_000_000),
    },
    {
        "productId": "word_wheel_pack_hard",
        "title": "Master Quest",
        "description": "The ultimate stash for serious word smiths.",
        "usd": (2, 990_000_000),
    },
    {
        "productId": "word_wheel_coins_small",
        "title": "300 Coins",
        "description": "Adds 300 coins to player balance",
        "usd": (0, 990_000_000),
    },
    {
        "productId": "word_wheel_coins_large",
        "title": "1,000 Coins",
        "description": "Adds 1,000 coins to player balance",
        "usd": (2, 490_000_000),
    },
]


def money(units: int, nanos: int, currency: str = "USD") -> dict:
    m = {"currencyCode": currency}
    if units:
        m["units"] = str(units)
    if nanos:
        m["nanos"] = nanos
    if units == 0 and not nanos:
        m["units"] = "0"
    return m


def auth_headers() -> dict:
    creds = service_account.Credentials.from_service_account_file(
        str(KEY), scopes=["https://www.googleapis.com/auth/androidpublisher"]
    )
    creds.refresh(Request())
    return {"Authorization": f"Bearer {creds.token}", "Content-Type": "application/json"}


def convert(headers: dict, units: int, nanos: int):
    url = (
        f"https://androidpublisher.googleapis.com/androidpublisher/v3/applications/"
        f"{PACKAGE}/pricing:convertRegionPrices"
    )
    r = requests.post(url, headers=headers, json={"price": money(units, nanos, "USD")})
    r.raise_for_status()
    converted = r.json().get("convertedRegionPrices", {})
    eur = None
    for item in converted.values():
        if item.get("price", {}).get("currencyCode") == "EUR":
            eur = item["price"]
            break
    return converted, eur or money(units, nanos, "EUR")


def build_body(headers: dict, product: dict) -> dict:
    units, nanos = product["usd"]
    converted, eur_price = convert(headers, units, nanos)
    regional = [
        {
            "regionCode": code,
            "price": item["price"],
            "availability": "AVAILABLE",
        }
        for code, item in converted.items()
        if item.get("price")
    ]
    return {
        "packageName": PACKAGE,
        "productId": product["productId"],
        "listings": [
            {
                "languageCode": "en-US",
                "title": product["title"],
                "description": product["description"],
            }
        ],
        "purchaseOptions": [
            {
                "purchaseOptionId": "default",
                "buyOption": {"legacyCompatible": True, "multiQuantityEnabled": False},
                "regionalPricingAndAvailabilityConfigs": regional,
                "newRegionsConfig": {
                    "usdPrice": money(units, nanos, "USD"),
                    "eurPrice": eur_price,
                    "availability": "AVAILABLE",
                },
            }
        ],
    }


def main() -> None:
    if not KEY.exists():
        raise SystemExit(f"Missing service account JSON: {KEY}")

    headers = auth_headers()
    requests_list = []
    for product in PRODUCTS:
        requests_list.append(
            {
                "oneTimeProduct": build_body(headers, product),
                "updateMask": "listings,purchaseOptions",
                "regionsVersion": {"version": REGIONS_VERSION},
                "allowMissing": True,
            }
        )
        time.sleep(0.2)

    url = (
        f"https://androidpublisher.googleapis.com/androidpublisher/v3/applications/"
        f"{PACKAGE}/oneTimeProducts:batchUpdate"
    )
    r = requests.post(url, headers=headers, json={"requests": requests_list})
    print("batchUpdate", r.status_code)
    if r.status_code >= 400:
        raise SystemExit(r.text)

    activate_url = (
        f"https://androidpublisher.googleapis.com/androidpublisher/v3/applications/"
        f"{PACKAGE}/oneTimeProducts/-/purchaseOptions:batchUpdateStates"
    )
    activate_reqs = [
        {
            "activatePurchaseOptionRequest": {
                "packageName": PACKAGE,
                "productId": p["productId"],
                "purchaseOptionId": "default",
            }
        }
        for p in PRODUCTS
    ]
    r2 = requests.post(activate_url, headers=headers, json={"requests": activate_reqs})
    print("batchUpdateStates", r2.status_code)
    if r2.status_code >= 400:
        raise SystemExit(r2.text)

    listed = requests.get(
        f"https://androidpublisher.googleapis.com/androidpublisher/v3/applications/"
        f"{PACKAGE}/oneTimeProducts",
        headers=headers,
    ).json()
    for p in sorted(listed.get("oneTimeProducts", []), key=lambda x: x["productId"]):
        title = (p.get("listings") or [{}])[0].get("title")
        state = (p.get("purchaseOptions") or [{}])[0].get("state")
        print(f"OK  {p['productId']}: {title} [{state}]")


if __name__ == "__main__":
    main()
