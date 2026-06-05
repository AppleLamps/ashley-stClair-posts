"""Build the public posts.json from a hand-picked list of post IDs."""
import json
import os
from datetime import datetime

ROOT = os.path.join(os.path.dirname(__file__), "..")
SOURCE_PATH = os.path.join(ROOT, "data", "posts-all.json")
OUT_PATH = os.path.join(ROOT, "data", "posts.json")

# Editorial order — most damning / clearest praise first.
CURATED_IDS = [
    "1854272441859629224",  # Thank you @elonmusk for saving America.
    "1888978180746219858",  # SSN ridicule — 23M views
    "1692598143664415204",  # incredible vision for humanity
    "1854147762457059490",  # greatest war general in modern history
    "1812933390490038357",  # Time to save America
    "1514679326591102982",  # Elon Musk is a hero
    "1888596808705646681",  # A modern tea party!
    "1888231333144428616",  # One of my favorites
    "1888976114275504145",  # USAID / mocking "Trump and Elon bad"
    "1856504028751896876",  # DOGE appointment with Elon
    "1857112684488987023",  # Elon may have saved America
    "1853822265923629200",  # May have saved America (reply)
    "1886937668996534310",  # Trump + Elon executing DOGE
    "1848148564876144647",  # Governor threatening to arrest Elon
    "1846342898549150029",  # critics can't do fraction of what Elon built
    "1849916180133265726",  # WaPo neutrality — Elon's bravery contagious
    "1701348691141906892",  # NYT "Crossed The Line" — defends Musk on ADL
    "1874260492803572061",  # Twitter purchase greatest for free speech
    "1717503623838474491",  # platform moving in great direction
    "1537531402610216960",  # Project Veritas — Elon on free speech
    "1654328067370655745",  # thank you — safe haven for memes
    "1800878930989396363",  # Tesla shareholders great returns
    "1787489921592144379",  # Full Self Driving incredible
    "1735098968915300484",  # Tesla / SpaceX / X — awesome
    "1863735038858145877",  # @Tesla Keep fighting!!!!
    "1795273151578046942",  # all of Elon's tech + endeavors are awesome
    "1259946537565564931",  # WE WILL PROTEST UNTIL YOU'RE RELEASED KING!
    "1733957578097381645",  # maximum based
    "1709287512240230838",  # VERY VERY BASED
    "1717902492606910558",  # The most based
    "1262082267737780225",  # based
    "1725633898153918681",  # Thank you — antisemitism visibility
    "1824840353620635851",  # Thank you for transparency (dictators)
    "1588670550129664000",  # fact-checkers weaponized censorship
    "1786089292537696725",  # free speech platform — right move
    "1860103035831423056",  # Countries without free speech not allies
    "1857086467467554886",  # @DOGE Tocqueville is great
    "1685029407067439104",  # quoting Elon — stop punching ourselves
    "1736024100227702934",  # quoting Elon on regulations (Gulliver)
    "1679607710663188482",  # incredible moment for Twitter, free speech
    "1697676320845529196",  # loved Twitter, long-time user
    "1863632347423207839",  # thank you grok
    "1851768077924397510",  # Make America Fun Again!
    "1764319686970249364",  # revival of the American spirit
    "1889551526164640210",  # Into the harbor NED goes (with @elonmusk)
    "1818684160782799083",  # Thank you 🖤
    "1829273704603492770",  # Keep fighting — @cb_doge Brazil
    "1845134681374659066",  # @Starlink @elonmusk
    "1594734413870514177",  # .@elonmusk You NEED to see this
    "1842939496746381464",  # To be fair, you did warn them!
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


if __name__ == "__main__":
    main()
