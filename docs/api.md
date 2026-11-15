# LendLoop API

The API is served by the Express backend at `/api`.

## Response envelope

Successful requests:

```json
{ "success": true, "data": {} }
```

Failed requests:

```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "Request validation failed." }
}
```

Validation errors may include `error.details`. The server does not expose stack
traces or internal error messages for unexpected failures.

## Authentication

Authentication uses an HTTP-only cookie and credentialed CORS from the
configured frontend origin. The client must use `credentials: "include"`.
Protected requests return `401 UNAUTHENTICATED` when the cookie is missing or
invalid. Authorization is enforced by backend ownership and role checks.
New registrations are always students; administrator roles are granted only
through the allowlisted `pnpm --filter @lendloop/backend admin:promote -- <email>`
operation.

## Endpoint groups

| Group | Planned endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Profile | `GET /users/me`, `PATCH /users/me` |
| Items | `GET /items`, `GET /items/mine`, `GET /items/:itemId`, `POST /items`, `PATCH /items/:itemId`, `DELETE /items/:itemId` |
| Borrowing | `POST /borrow-requests`, `GET /borrow-requests`, `PATCH /borrow-requests/:requestId/decision`, `GET /loans`, `POST /loans/:loanId/return`, `PATCH /loans/:loanId/return` |
| Messaging | `GET /conversations`, `GET /conversations/:conversationId/messages`, `POST /conversations/:conversationId/messages`, `PATCH /conversations/:conversationId/read` |
| Notifications | `GET /notifications`, `PATCH /notifications/:notificationId/read` |
| Reputation | `GET /reputation/me`, `GET /reputation/me/events` |
| Rewards | `GET /rewards/me`, `GET /rewards/me/events` |
| Reports | `POST /reports`, `GET /admin/reports`, `PATCH /admin/reports/:reportId` |

`GET /reputation/me` returns the authenticated student's current score,
standing, and reward total. `GET /reputation/me/events` returns that student's
score event history. Scores are updated by the API when a loan is confirmed
returned; there is no client write endpoint.
`GET /rewards/me` and `/rewards/me/events` return the authenticated student's
points balance and ledger. Points are awarded only for the documented
provisional on-time return event and are not client-editable.

`GET /users/me` returns the signed-in student's profile. `PATCH /users/me`
accepts one or more of `name`, `bio`, and `avatarUrl`; email, student ID, role,
and reputation values are not editable through this endpoint. Avatar URLs must
use HTTPS.

Query pagination uses `page` (1-based) and `limit` (bounded to 100). Item
search uses `q`, `category`, `availability` (`available`, `unavailable`, or
`all`; defaults to `available`), and `sort` (`newest`, `oldest`, or `title`).
Archived listings are never included. `GET /items/mine` returns the
authenticated owner's non-archived listings, including unavailable ones; item
writes are authenticated and ownership-checked.
`POST /items` creates a listing; `PATCH /items/:itemId` edits an owned listing
or its availability; `DELETE /items/:itemId` archives it. Listing photos are
optional HTTPS URLs (no file-upload service is configured). The public detail
endpoint returns available listings only.

Borrow requests transition from `pending` to `approved`, `rejected`, or
`cancelled`, then to `returned` after the related loan is returned. Approval
reserves the item and creates an active loan in a MongoDB transaction. The
borrower marks an active loan ready to return with
`POST /loans/:loanId/return`; the owner confirms the return with
`PATCH /loans/:loanId/return`. The confirmed loan and related request are
updated together. The server enforces a maximum of five active loans per
borrower both when requests are submitted and when owners approve them.

Approval creates a private conversation for the loan. Conversation and message
reads and writes require participant membership; `PATCH
/conversations/:conversationId/read` marks incoming messages as read.

Notifications are always scoped to the authenticated recipient. `GET
/notifications?unreadOnly=true` filters unread entries; `PATCH
/notifications/:notificationId/read` marks one of that recipient's entries as
read. Borrowing and messaging workflows create notifications server-side.

Students submit reports with `POST /reports`; their identity is taken from the
session. Reports are private. Only an administrator can use `/admin/reports`
to review or update status. `referred_to_osa` is an internal prototype status,
not a live OSA integration.
