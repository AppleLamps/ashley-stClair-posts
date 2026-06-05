"""Build the public posts.json from a hand-picked list of post IDs."""
import json
import os
from datetime import datetime

import openpyxl

ROOT = os.path.join(os.path.dirname(__file__), "..")
SOURCE_PATH = os.path.join(ROOT, "data", "posts-all.json")
XLSX_PATH = os.path.join(ROOT, "Ashley-posts.xlsx")
OUT_PATH = os.path.join(ROOT, "data", "posts.json")

# Editorial order — most damning / clearest praise first.
CURATED_IDS = [
    "1854272441859629224",  # Thank you @elonmusk for saving America.
    "1692598143664415204",  # incredible vision for humanity
    "1514679326591102982",  # Elon Musk is a hero
    "1854147762457059490",  # greatest war general in modern history
    "1874260492803572061",  # Twitter purchase greatest for free speech
    "1795273151578046942",  # all of Elon's tech + endeavors are awesome
    "1846342898549150029",  # critics can't do fraction of SpaceX/Tesla
    "1787489921592144379",  # Full Self Driving incredible
    "1800878930989396363",  # Tesla shareholders great returns
    "1858993271076438325",  # Trump's love of Elon's rockets / Starship
    "1888978180746219858",  # SSN ridicule — 23M views
    "1812933390490038357",  # Time to save America
    "1853822265923629200",  # May have saved America (reply)
    "1857112684488987023",  # Elon may have saved America
    "1849916180133265726",  # WaPo neutrality — Elon's bravery contagious
    "1745158091782443121",  # historic moment for humanity / X free speech
    "1777338152287391865",  # Reuters vs Musk/X protecting Brazil speech
    "1717503623838474491",  # platform moving in great direction
    "1679607710663188482",  # incredible moment for Twitter, free speech
    "1725892699809575111",  # Babylon Bee freed; X welcomes free speech
    "1518969755654361088",  # Twitter is a safe space now
    "1518630744704360449",  # TWITTER WILL BE GREAT AGAIN
    "1654328067370655745",  # thank you — safe haven for memes
    "1537531402610216960",  # Project Veritas — Elon on free speech
    "1701348691141906892",  # NYT "Crossed The Line" — defends Musk on ADL
    "1786089292537696725",  # free speech platform — right move
    "1860103035831423056",  # Countries without free speech not allies
    "1829958380922028377",  # if others joined Elon, internet saved
    "1745798165037531277",  # X as vector for free speech
    "1790870974394409071",  # X as lone free speech platform
    "1799581524053885296",  # Tesla/SpaceX doubters vs free speech doubters
    "1824840353620635851",  # Thank you for transparency (dictators)
    "1737700474218823915",  # X tools let people speak anonymously
    "1856504028751896876",  # DOGE appointment with Elon
    "1886937668996534310",  # Trump + Elon executing DOGE
    "1888976114275504145",  # USAID / mocking "Trump and Elon bad"
    "1848148564876144647",  # Governor threatening to arrest Elon
    "1851768077924397510",  # Make America Fun Again!
    "1764319686970249364",  # revival of the American spirit
    "1259946537565564931",  # WE WILL PROTEST UNTIL YOU'RE RELEASED KING!
    "1888596808705646681",  # A modern tea party!
    "1888231333144428616",  # One of my favorites
    "1733957578097381645",  # maximum based
    "1709287512240230838",  # VERY VERY BASED
    "1717902492606910558",  # The most based
    "1262082267737780225",  # based
    "1725633898153918681",  # Thank you — antisemitism visibility
    "1863735038858145877",  # @Tesla Keep fighting!!!!
    "1829273704603492770",  # Keep fighting — @cb_doge Brazil
    "1845134681374659066",  # @Starlink @elonmusk
]


def main() -> None:
    if not os.path.exists(SOURCE_PATH):
        source = os.path.join(ROOT, "data", "posts.json")
        if os.path.exists(source):
            os.replace(source, SOURCE_PATH)
        else:
            raise FileNotFoundError("Run extract-posts.py first to create data/posts-all.json")

    with open(SOURCE_PATH, encoding="utf-8") as handle:
        all_posts = {p["post_id"]: p for p in json.load(handle)["posts"]}

    missing_from_json = [post_id for post_id in CURATED_IDS if post_id not in all_posts]
    if missing_from_json:
        all_posts.update(load_posts_from_spreadsheet(missing_from_json))

    curated = []
    missing = []

    for post_id in CURATED_IDS:
        post = all_posts.get(post_id)
        if not post:
            missing.append(post_id)
            continue
        entry = {k: v for k, v in post.items() if k != "score"}
        curated.append(entry)

    if missing:
        raise RuntimeError(f"Missing curated post IDs: {missing}")

    payload = {
        "posts": curated,
        "generated": datetime.now().isoformat(),
        "total": len(curated),
        "curated": True,
    }

    with open(OUT_PATH, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)

    print(f"Wrote {len(curated)} curated posts to {OUT_PATH}")


def load_posts_from_spreadsheet(post_ids: list[str]) -> dict[str, dict]:
    """Fetch hand-picked posts that were not part of the broad JSON extract."""
    wanted = set(post_ids)
    found: dict[str, dict] = {}

    wb = openpyxl.load_workbook(XLSX_PATH, read_only=True)
    ws = wb["stclairashley_posts"]

    for row in ws.iter_rows(min_row=2, values_only=True):
        post_id, content, lang, ptype, bookmarks, favorites, reposts, replies, views, posted = row
        pid = str(post_id).strip("'")
        if pid not in wanted or not isinstance(content, str):
            continue

        found[pid] = {
            "post_id": pid,
            "content": content,
            "lang": lang or "en",
            "type": ptype,
            "bookmarks": int(bookmarks or 0),
            "favorites": int(favorites or 0),
            "reposts": int(reposts or 0),
            "replies": int(replies or 0),
            "views": int(views or 0),
            "posted": posted.isoformat() if hasattr(posted, "isoformat") else str(posted),
            "url": f"https://x.com/stclairashley/status/{pid}",
        }

        if len(found) == len(wanted):
            break

    return found


if __name__ == "__main__":
    main()
