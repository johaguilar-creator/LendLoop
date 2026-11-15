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
| Messaging | `GET /conversations`, `GET /conversations/:conversationId/messages`, `POST /conversations/:conversationId/messages` |
| Notifications | `GET /notifications`, `PATCH /notifications/:notificationId/read` |
| Reputation | `GET /reputation/me`, `GET /reputation/me/events` |
| Reports | `POST /reports`, `GET /admin/reports`, `PATCH /admin/reports/:reportId` |

Query pagination uses `page` (1-based) and `limit` (bounded to 100). Item
search uses `q`, `category`, and `sort` (`newest`, `oldest`, or `title`).
The public item list includes available, non-archived listings only. Owners use
`GET /items/mine` to retrieve their own unavailable listings; item writes are
authenticated and ownership-checked.

Borrow requests transition from `pending` to `approved`, `rejected`, or
`cancelled`. Approval reserves the item and creates an active loan in a MongoDB
transaction. The borrower marks an active loan ready to return with
`POST /loans/:loanId/return`; the owner confirms the return with
`PATCH /loans/:loanId/return`. The confirmed loan and related request are
updated together.
