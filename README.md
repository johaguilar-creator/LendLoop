# LendLoop

LendLoop is a student-to-student lending app. The repository is organized as a
pnpm workspace with a React/Vite frontend and an Express/Mongoose backend.

## Project structure

- `frontend/` — React 19 and Vite application
- `backend/` — Express API and MongoDB connection
- `References/` — local Trello and Figma reference materials (not tracked by Git)

## Requirements

- Node.js 22
- pnpm 10
- MongoDB, local or hosted

## Run locally

1. Install workspace dependencies:

   ```sh
   pnpm install
   ```

2. Create `backend/.env` from `backend/.env.example`; set `MONGODB_URI` to your
   MongoDB connection string and replace `JWT_SECRET` with a random value of at
   least 32 characters.

3. Start both applications:

   ```sh
   pnpm dev
   ```

   The frontend runs at `http://localhost:8443`; the API runs at
   `http://localhost:5000`. The health endpoint is `GET /api/health`.

Run only one app with `pnpm dev:frontend` or `pnpm dev:backend`. Build the
frontend with `pnpm build`.

## API conventions

Successful responses use `{ "success": true, "data": ... }`. Errors use
`{ "success": false, "error": { "code": "...", "message": "..." } }`.

## Branching

Keep implementation tickets on separate, unmerged branches named
`feature/<TRELLO-ID>-<short-description>`. Use lowercase descriptions and retain
the Trello ID's exact casing.
