# Decisions

## Built

The core end-to-end flow: a focused landing page; email/password registration and login; protected quote creation; server-side calculation; PostgreSQL persistence; quote history; a full saved-quote breakdown; sign-out; and a responsive print view. The calculator carries JavaScript number precision until formatting and the three supplied cases are automated tests.

## Cut deliberately

I did not build quote duplication, search/filter, CSV export, password reset, email verification, billing, organisations, real email, a mobile app, or generated PDFs. These are explicitly optional/out of scope and would dilute the core journey in a time-boxed exercise. Browser printing handles printable quotes without a PDF library.

## Reasonable assumptions

Each quote owns a customer name and optional notes, since a manufacturer needs a useful label when revisiting it. Rates and dimensions must be positive; wastage and margin may be zero. A quote's calculated values are saved as snapshots so later user activity cannot change historical quotes.

## Next

For production, add rate limiting and email verification, move authentication to secure cookies, add migrations, audit logs, accessibility testing, and a quote-share workflow.

## Stuck

No product blockers. Local PostgreSQL requires Docker Desktop because no database service is assumed on the host.
