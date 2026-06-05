"""Extract Ashley St. Clair posts praising Elon Musk, ranked by contradiction score."""
import json
import os
import re
from datetime import datetime

import openpyxl

XLSX_PATH = os.path.join(os.path.dirname(__file__), "..", "Ashley-posts.xlsx")
OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "posts-all.json")

PRAISE_PATTERNS = [
    (r"\b(genius|brilliant|greatest|hero|legend|amazing|incredible|inspiring|admire|respect)\b", 4),
    (r"\b(love you|loves you|my favorite|one of my favorites|favorites)\b", 4),
    (r"\b(thank you|thanks elon|thank u)\b", 3),
    (r"\b(based|king|goat|well done|spot on|correct take|absolutely|exactly|agree|facts)\b", 2),
    (r"\b(save|saving|saved)\b.{0,40}\b(america|humanity|world|us)\b", 4),
    (r"\b(free speech|doge|xai|tesla|spacex|starlink|grok)\b.{0,80}\b(good|great|love|support|defend|important|necessary|vital|amazing)\b", 3),
    (r"\bmodern tea party\b", 5),
    (r"@elonmusk", 2),
]

NEGATIVE_PATTERNS = [
    (r"\b(trump and elon bad|elon bad|elon musk bad)\b", 8),
    (r"\b(petulant|man-child|hitler|pedo|mechahitler|evil|vile|corrupt|bribe|nda|sloperator)\b", 5),
    (r"\b(opposed|against|fight|enemy|bitter|disobedience|punish)\b.{0,50}\b(elon|musk)\b", 4),
    (r"\b(elon|musk)\b.{0,50}\b(opposed|against|fight|enemy|bitter|dangerous|evil|vile|corrupt)\b", 4),
    (r"\b(dangerous|danger|threat|harmful|breeding ground|accountable|investigate)\b", 3),
    (r"\b(zimbabwe|hurting my brain|don't trust)\b", 3),
    (r"\b(enemies to lovers)\b", 2),
]

HIGH_CONTRADICTION_BOOSTS = [
    (r"what the fuck do you think elon musk is going to do with your social security", 12),
    (r"i have yet to read a substantive argument against the audit & defunding of usaid", 10),
    (r"mostly just democrat npcs yelling.*trump and elon bad", 8),
    (r"the american people deserve to know", 4),
    (r"into the harbor ned goes", 6),
    (r"instrumental in the architecture and execution of the censorship industrial complex", 4),
    (r"a modern tea party", 6),
    (r"one of my favorites", 5),
]


def mentions_elon_ecosystem(content: str) -> bool:
    return bool(
        re.search(
            r"(@elonmusk|\belon\b|\bmusk\b|\bxai\b|\bgrok\b|\bdoge\b|\btesla\b|\bspacex\b|\bstarlink\b|\btwitter\b)",
            content,
            re.I,
        )
    )


def score_post(content: str, post_type: str) -> int | None:
    text = content.lower()

    if not mentions_elon_ecosystem(content):
        return None

    score = 0

    for pattern, points in NEGATIVE_PATTERNS:
        if re.search(pattern, text, re.I):
            score -= points

    for pattern, points in PRAISE_PATTERNS:
        if re.search(pattern, text, re.I):
            score += points

    for pattern, points in HIGH_CONTRADICTION_BOOSTS:
        if re.search(pattern, text, re.I):
            score += points

    if "@elonmusk" in text and score <= 1:
        supportive = re.search(
            r"(modern tea party|one of my favorites|thank|genius|based|king|tea party|ned goes)",
            text,
            re.I,
        )
        sarcastic = re.search(
            r"(zimbabwe|brain|trust u|petulant|man-child|hurt)",
            text,
            re.I,
        )
        if supportive and not sarcastic:
            score += 5
        elif sarcastic:
            score -= 3

    if score <= 0:
        return None

    return score


def clean_post_id(raw_id) -> str:
    return str(raw_id).strip("'")


def main() -> None:
    wb = openpyxl.load_workbook(XLSX_PATH, read_only=True)
    ws = wb["stclairashley_posts"]

    posts = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        post_id, content, lang, ptype, bookmarks, favorites, reposts, replies, views, posted = row
        if not content or not isinstance(content, str):
            continue

        score = score_post(content, ptype)
        if score is None:
            continue

        pid = clean_post_id(post_id)
        posts.append(
            {
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
                "score": score,
                "url": f"https://x.com/stclairashley/status/{pid}",
            }
        )

    deduped: dict[str, dict] = {}
    for post in posts:
        existing = deduped.get(post["post_id"])
        if not existing or post["score"] > existing["score"]:
            deduped[post["post_id"]] = post

    ranked = sorted(
        deduped.values(),
        key=lambda item: (-item["score"], -item["favorites"], -item["views"]),
    )

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    payload = {
        "posts": ranked,
        "generated": datetime.now().isoformat(),
        "total": len(ranked),
    }
    with open(OUT_PATH, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)

    print(f"Extracted {len(ranked)} praise posts")
    for post in ranked[:10]:
        preview = post["content"][:90].replace("\n", " ")
        print(f"  [{post['score']}] {post['posted'][:10]} — {preview}")


if __name__ == "__main__":
    main()
