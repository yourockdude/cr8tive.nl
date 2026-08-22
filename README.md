# Design Engineer portfolio

Personal portfolio for a design engineer: selected work and case studies.

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin: [http://localhost:3000/admin](http://localhost:3000/admin) — email and password from `.env.local`.

```bash
npm run lint
npm run build
```

## Content

Texts and projects live in `content/` and are edited in the admin. Uploads go to `public/uploads/`.
The home page lists the four most recent projects; the full archive is at `/work`. The footer
clock follows the `timezone` field (an IANA name, set in the admin).

`sitemap.xml` and `robots.txt` are generated from the same content at build time. The social card
is a static image at `app/(site)/opengraph-image.png`, so it does not follow admin edits —
regenerate it by hand if the name or role changes.

The live site is [cr8tive.nl](https://cr8tive.nl), built as a static export and deployed from GitHub Pages. Admin writes stay local until you commit `content/` and `public/uploads/` and push `main`.
