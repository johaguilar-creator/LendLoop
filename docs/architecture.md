# LendLoop architecture

## Application boundaries

- `frontend/` is the React 19/Vite client and owns presentation, form state, and
  API calls.
- `backend/` is the Node.js/Express API and owns authentication, validation,
  permissions, business rules, and persistence.
- MongoDB is accessed through Mongoose. Database credentials are configured only
  in `backend/.env`; `backend/.env.example` contains placeholders.

## API conventions

All endpoints are under `/api`. Successful responses use
`{ "success": true, "data": ... }`; failures use
`{ "success": false, "error": { "code": "...", "message": "..." } }`.
Validation errors may include field details in `error.details`. Use standard
HTTP status codes and do not return stack traces to clients.

The browser authenticates with an HTTP-only, same-site cookie. The API enables
credentialed CORS only for the configured frontend origin. Protected endpoints
derive the user identity and role from the validated session, never from a
client-supplied user ID.

## Data model contracts

- **User** owns a profile, role, credit score, reward balance, and active-loan
  count. Password hashes and session version are server-only.
- **Item** belongs to an owner and contains listing text, category, condition,
  availability, and an optional image URL.
- **BorrowRequest** links an item, borrower, and owner. Its workflow is
  `pending -> approved | rejected | cancelled`; approval creates a **Loan**.
- **Loan** links the approved request, item, borrower, and owner. Its workflow
  is `active -> return_requested -> returned`; due dates determine overdue
  state.
- **Conversation** is restricted to its participants and may reference a loan.
  **Message** records sender and creation time.
- **Notification** and **RewardEvent** are recipient/owner scoped. Reward events
  have an idempotency key.
- **CreditEvent** records score adjustments with an idempotency key.
- **Report** stores reporter, subject, category, description, and review/OSA
  referral status. Students can submit reports; only configured administrators
  can review them.

## Decisions and open approvals

- The Figma reference shows a maximum of five concurrent borrowings. This is
  used as the prototype limit unless the group confirms a different value.
- Trello requires group approval of score and reward rules but does not specify
  values. The implementation uses centralized, documented provisional rules:
  a 100-point starting score, +2 for an on-time return, -10 for a late return,
  and 50 reward points for an on-time return. These remain subject to group
  approval and are not represented as an approved institutional policy.
- No upload provider or OSA system integration is specified. Listings accept an
  image URL; OSA referral is represented as an internal report status only.
- Local MongoDB deployments must support transactions for approval/return
  workflows; MongoDB Atlas provides this through replica sets.

## Source references

`References/` is retained locally for the Trello export and original Figma Make
source. The copied Figma app in `frontend/` is the editable application. The
Figma app currently contains the visual shell for browsing, loans, chat,
notifications, profiles, and reports, but its original data and interactions
are hardcoded; the feature and integration tickets replace those placeholders.

The Trello card for LL-INT-04 has a discrepancy between its text assignment and
the member IDs in the export. Preserve both records in the progress tracker;
the card text lists Ian Karl S. Esmabe, Justin Mangubat, and Erice Matthew
Isaiah Cama.
