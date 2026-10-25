# Apex Fitness

Gym management platform. Members join, pay, book classes, rent lockers and
check in at the front desk. Staff manage members, payments and reporting.

## Stack

- Client: Next.js 14 (App Router), deployed on Vercel
- Server: Express + Sequelize, deployed on Render
- Database: PostgreSQL
- Payments: Paystack
- File storage: Cloudflare R2 (member photos)

Node 20 or later.

## Roles

| Role | Can do |
| --- | --- |
| Member | Book classes, manage membership and locker, view payments |
| Receptionist | Check members in, look up members, activate walk-in subscriptions |
| Manager | Everything a receptionist can, plus member and class management |
| Admin | Full access including pricing, staff, reports and revenue |

## Running locally

Create the database:

```
createdb apexfitness
```

Copy `server/.env.example` to `server/.env` and fill it in. Leave
`DATABASE_URL` empty when running against a local Postgres and set `DB_NAME`,
`DB_USER`, `DB_HOST` and `DB_PORT` instead. Setting `DATABASE_URL` turns on SSL,
which a local Postgres will reject.

Use Paystack test keys locally.

Set up the server:

```
cd server
npm install
npm run setup-db
npm run seed
npm run dev
```

`setup-db` creates the tables, plans, pricing settings and a manager login
(manager@apexfitness.ng), printing the generated password once. `seed` adds
sample members and classes.

Then the client, in a second terminal:

```
cd client
npm install
npm run dev
```

Copy `client/.env.local.example` to `client/.env.local` and point
`NEXT_PUBLIC_API_URL` at whatever port the server reported on startup.

The site runs on http://localhost:3000.

## Tests

```
cd server && npm test
cd client && npm run lint
```

Run `./setup.sh` once after cloning to install the git hooks. They lint the
client before each commit and run the server tests before each push.

## Database changes

Development runs `sequelize.sync({ alter: true })` on boot, so model changes
apply automatically. Production does not, so schema changes need a script in
`server/src/scripts` run manually after deploy. The existing ones are wired up
as npm scripts, for example:

```
npm run migrate:indexes
npm run migrate:notif-enum
npm run migrate:joining-fee
npm run create-weekend-plan
npm run create-locker-plans
```

`npm run audit:payments` is read-only and prints revenue split by membership
and joining fees, plus any duplicate offline activations.

## Payments

Card payments and renewals go through Paystack. Renewals arrive as
`invoice.update` webhooks, which extend the subscription end date. The webhook
signature is verified before anything is processed.

Cash and transfer payments are recorded through the walk-in activation on the
admin and receptionist member screens. These save a payment marked success with
an `APEX-MANUAL-` reference and never contact Paystack, since the money was
collected offline.

Cancelling a membership or locker stops the recurring charge but keeps access
until the paid period ends, then it lapses.

## Deployment

Push to `main`. GitHub Actions runs the tests, then triggers the Render deploy
for server changes. Vercel builds the client. Deploy the server first when a
release adds new API endpoints the client depends on.
