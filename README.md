# Design Engineer portfolio

Personal portfolio for a design engineer: selected work and case studies, with
an admin for editing them.

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin:
[http://localhost:3000/admin](http://localhost:3000/admin).

Without `GITHUB_TOKEN` the admin writes the files under `content/` directly,
which is what you want locally. With a token it commits them to the repository
instead.

```bash
npm run lint
npm run typecheck
npm run build
```

## Content

Texts, case studies and uploads live in the repository under `content/`. The
site reads them from GitHub at request time and caches the result; saving in the
admin commits the change and expires that cache, so an edit is live on the next
request without a redeploy. Content commits carry `[skip ci]` so they do not
trigger a build of their own.

Uploads are committed to `content/uploads/` and served by
[app/media/[name]](app/media/[name]/route.ts) rather than from `public/`: a file
committed after the last deploy is not in the build output, so a static path
would 404 until the next one.

If GitHub is unreachable the site falls back to the copy of `content/` bundled
into the deployment — it goes stale rather than down.

The home page lists the four most recent projects; the full archive is at
`/work`. The footer clock follows the `timezone` field (an IANA name).
`sitemap.xml` and `robots.txt` are generated from the same content. The social
card is a static image at `app/(site)/opengraph-image.png` and does not follow
admin edits — regenerate it by hand if the name or role changes.

## Deploy

The site needs a Node host; it is no longer a static export. On Vercel:

1. Import the repository.
2. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AUTH_SECRET`, `GITHUB_REPO`,
   `GITHUB_BRANCH` and `GITHUB_TOKEN`. The token is a fine-grained personal
   access token scoped to this repository with **Contents: read and write** —
   nothing else.
3. Point cr8tive.nl at Vercel, then delete `.github/workflows/deploy.yml`; it
   builds a static export that no longer exists.

Login is rate limited per IP, but only in the memory of one instance
([lib/rate-limit.ts](lib/rate-limit.ts)), so it resets on a cold start. A
shared store would be stronger if the admin ever needs it.
