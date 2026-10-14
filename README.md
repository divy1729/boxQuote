# BoxQuote

A corrugated-box quoting micro-SaaS built for the PackWares intern exercise. It provides secure accounts, server-side pricing, saved quote history, detailed cost breakdowns, and a browser-printable quote page.

## Stack

- Client: React 19, TypeScript, Vite, Tailwind CSS
- API: Node.js, Express, TypeScript, raw parameterised SQL
- Database: PostgreSQL

## Run locally

Prerequisites: Node 20+ and Docker Desktop.

```bash
cp .env.example server/.env
npm install
npm run db:up
npm run dev
```

Open `http://localhost:5173`. The API creates its tables on startup. To make a production build, run `npm run build`.

## Verification

```bash
npm test
```

The calculator tests include all three values supplied in the exercise brief. All financial calculation happens in the API; the browser only displays the returned breakdown.

## Deploy to Render

The included `render.yaml` deploys the API, React application, and PostgreSQL database together. In Render, choose **New > Blueprint**, connect this GitHub repository, and select `render.yaml`. Render generates `JWT_SECRET`, wires the managed database to `DATABASE_URL`, and publishes a single HTTPS URL.

## Design choices

- JWT is stored in `localStorage` for this small demo. In production, use short-lived access tokens with secure HTTP-only refresh cookies.
- PostgreSQL identity columns and a `user_id` foreign key ensure quote ownership is enforced in every query.
- Currency uses `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.
