# That Random Store

Static storefront site published with [GitHub Pages](https://docs.github.com/en/pages) from the `/docs` folder.

## GitHub Pages setup (recommended: Actions + secret)

This keeps your WhatsApp number **out of the repository** while still working on the live site.

1. **Secret:** Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**  
   - Name: `WHATSAPP_NUMBER`  
   - Value: country code + number, no `+` (e.g. `918076312944`)

2. **Pages source:** **Settings** → **Pages** → **Build and deployment** → **Source:** **GitHub Actions** (not “Deploy from branch”).

3. Push to `main`. The workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) builds `docs/`, injects `store-config.local.js` from the secret **only in the deploy artifact** (never committed), and publishes.

4. Site URL: `https://<username>.github.io/<repo-name>/`

### Legacy: deploy from `/docs` branch folder

You can still use **Deploy from branch → `/docs`**, but then either the number is missing (gitignored local config) or you would have to commit it. Prefer **GitHub Actions** above.

## Security: what “hidden” can and can’t mean

| Concern | Reality |
|--------|---------|
| Number in Git / public commits | **Avoid** — use gitignored `store-config.local.js` locally + `WHATSAPP_NUMBER` Actions secret for deploy. |
| Number on the live website | **Cannot hide** — WhatsApp links (`wa.me/…`) must include the business number; anyone can view source or network tab. Same as listing it on your site footer. |
| Someone “hacking” the cart | The cart is **client-side only** (localStorage). There is **no payment** and **no server order** — you confirm price and stock in WhatsApp. Tampering with cart totals only affects their phone’s message, not your inventory system. |
| Spam / harassment on WhatsApp | Use **WhatsApp Business**: block/report, away messages, don’t share payment details in auto-replies. Consider a dedicated business number, not your personal one. |
| Scrapers / bots | Static sites can’t enforce rate limits without a **backend** (Cloudflare Worker, serverless function). For a small shop, manual confirmation in chat is usually enough. |

**Best practical setup for you:** public GitHub repo + **Actions secret** + **human confirmation** on every order in WhatsApp. Treat the number like a business phone line, not a password.

Optional later upgrades (only if abuse becomes a problem): Cloudflare Turnstile before opening WhatsApp, or a tiny serverless endpoint that logs orders — not required to launch.

The site uses plain HTML with shared header/footer fragments loaded by `docs/js/includes.js`. Partials live in `docs/partials/` and use a `{{ROOT}}` placeholder for correct links from the home page and product pages.

## Local preview

Partials are loaded with `fetch`, so open the site through a local server (not `file://`):

```bash
cd docs && python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Structure

| Path | Purpose |
|------|---------|
| `docs/index.html` | Home — hero, Handcrafted rows, footer |
| `docs/partials/` | Reusable header and footer HTML |
| `docs/products/` | Product detail pages |
| `docs/css/styles.css` | Shared styles |
| `docs/data/category-images.json` | Image lists per category for home slideshows |
| `docs/js/slideshow.js` | Rotates category images on the home page |
| `docs/js/includes.js` | Loads partials and scroll animations |
| `docs/.nojekyll` | Ensures GitHub Pages serves all files as-is |

When you add photos under `docs/images/`, update `docs/data/category-images.json` (GitHub Pages cannot list folders automatically).

### Cart & WhatsApp checkout

WhatsApp checkout runs entirely in the browser, so your **business number is always visible** to anyone who uses “Place order on WhatsApp” (that’s normal). The goal is to **keep it out of Git**, not to hide it from customers.

**Local / development**

1. Copy the template:  
   `cp docs/js/store-config.example.js docs/js/store-config.local.js`
2. Edit `docs/js/store-config.local.js` with your WhatsApp number (country code + number, no `+`, e.g. `918076312944`).
3. That file is listed in `.gitignore` and will **not** be pushed to GitHub.

The site loads `store-config.local.js` first, then falls back to `store-config.example.js` (empty number) if the local file is missing.

**Production:** use the GitHub Actions deploy workflow and `WHATSAPP_NUMBER` secret (see above) — do not commit the local config file.

If you already committed a real number in an old `store-config.js`, remove it from the repo; old commits may still contain it unless you rewrite history.

### Order IDs (no backend)

Each time a customer taps **Place order on WhatsApp**, the site generates a reference like **`TRS-20260726-K7M2`** and puts it at the top of the WhatsApp message. You do not need a server for this.

**Your side (manual process)**

1. Customer sends the chat — the **order reference** is in the first line.
2. In WhatsApp Business, **star** the chat or add a **label** (e.g. “New order”, “Paid”, “Shipped”).
3. Log the same ID in a **Google Sheet** (or notebook): `Order ID | Date | Customer | Items | Total | Status | Notes`.
4. Reply in WhatsApp quoting the reference: “Confirmed **TRS-…** — total ₹X after shipping. UPI: …”
5. Update status in the sheet when paid / shipped / done.

**Edit the WhatsApp order message:** `docs/js/cart.js` → function `buildWhatsAppUrl` → the `lines` array (greeting, footer text). Store name and currency come from `store-config.local.js` (`storeName`, `currencySymbol`). Line items and total are built automatically from the cart.

**Important**

- The ID is **not proof of payment** — only confirm after you verify payment manually.
- IDs are generated in the browser (date + random). Collisions are extremely unlikely; if two match, use chat timestamp.
- When you add a backend later, you can replace this with server-issued IDs and keep the same `TRS-` format.
