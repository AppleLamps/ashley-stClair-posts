# Ashley St. Clair Praised Elon Musk

A public-facing site documenting Ashley St. Clair’s posts and replies on X that praise, defend, or support Elon Musk — ordered so the posts most at odds with what she says today appear first.

Live site: deploy to [Vercel](https://vercel.com) (see below).

## What's in the repo

```
├── index.html          # Site entry point
├── css/styles.css      # Styles
├── js/                 # App logic (vanilla ES modules)
├── data/posts.json     # 50 hand-picked posts (required for deploy)
├── data/featured.json  # Top 5 with editorial context
├── data/posts-all.json # Full auto-extracted set (local only, gitignored)
├── Ashley-posts.xlsx   # Source spreadsheet
└── scripts/
    └── extract-posts.py  # Regenerates data/posts.json from the spreadsheet
```

The site is **static** — no server, database, or API keys. Vercel serves the files as-is.

## Local development

ES modules cannot load `data/posts.json` from `file://`, so run a local server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Alternative without npm:

```bash
npx serve . -l 3000
```

## Updating post data

When `Ashley-posts.xlsx` is updated:

```bash
pip install -r requirements.txt
python scripts/extract-posts.py
```

This writes `data/posts-all.json` (the full auto-extracted set). Then build the public set:

```bash
python scripts/build-curated.py
```

That writes `data/posts.json` — the **50 hand-picked posts** the site displays. Edit the `CURATED_IDS` list in `build-curated.py` to change which posts ship. Commit `data/posts.json` and redeploy.

## Updating featured posts

The five posts at the top are listed in `data/featured.json` with a short `why` line each. They must also appear in the curated 50. The app pulls full post text from `posts.json`.

## Deploy to Vercel

### Option A — GitHub (recommended)

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Use the defaults. Vercel detects a static site — **no build step** is required.
4. Click **Deploy**.

`vercel.json` sets empty `installCommand` and `buildCommand` so Vercel skips npm/Python installs and publishes the files directly.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts. For production:

```bash
vercel --prod
```

### What gets deployed

These paths must be present in the repo:

- `index.html`
- `css/`
- `js/`
- `data/posts.json`

The spreadsheet and Python script are optional on Vercel — they are only needed locally to regenerate data.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank page / posts not loading | Confirm `data/posts.json` is committed and deployed |
| Changes not visible after deploy | Hard-refresh the browser; post data is cached for 1 hour |
| Local "could not load" error | Use `npm run dev`, not opening `index.html` directly |

## License

Post content belongs to the original authors on X. This project compiles publicly available posts for reference and links to each original.
