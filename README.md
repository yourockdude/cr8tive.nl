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

The live site is [cr8tive.nl](https://cr8tive.nl), built as a static export and deployed from GitHub Pages. Admin writes stay local until you commit `content/` and `public/uploads/` and push `main`.
