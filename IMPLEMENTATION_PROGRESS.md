# LendLoop implementation progress

Baseline commit: `903cb41` (`chore: initialize LendLoop project repository`).
The local structure correction is on
`feature/LL-INT-01-initial-project-structure` (`1caabe5`). The baseline push to
`origin/main` is blocked: GitHub returned HTTP 403 for authenticated account
`GabrielRamores05`, which lacks write permission to
`johaguilar-creator/LendLoop`. No feature branches have been pushed.

Statuses below reflect the local workspace. “Trello status” is from the
provided export; implementation status is independent.

| Trello ID | Exact task title | Assigned member(s) | Trello status | Implementation status | Branch | Commit / tests / remaining |
|---|---|---|---|---|---|---|
| LL-UI-01 | Design LendLoop system mock screens in Figma | Ian Karl S. Esmabe | Done | IMPLEMENTED | Existing Figma source | Audited; reference project retained locally. |
| LL-INT-01 | Set up repository and initial project structure | Ian Karl S. Esmabe | Done | BLOCKED | `feature/LL-INT-01-initial-project-structure` | `1caabe5`; local React/Vite and Express/Mongoose workspace; GitHub push requires repository write access. |
| LL-BE-01 | Design initial MongoDB database schemas | Jan Africa | For Approval | TESTED | `feature/LL-BE-01-database-schemas` | `7715165`; `pnpm --filter @lendloop/backend test` (4 passed). |
| LL-BE-02 | Implement authentication and ADNU email validation | Jan Africa | For Approval | TESTED | `feature/LL-BE-02-authentication` | `e6f5d94`; `pnpm --filter @lendloop/backend test` (9 passed); full DB-backed registration/login awaits MongoDB. |
| LL-BE-03 | Set up backend API routing and response format | Erice Matthew Isaiah Cama | For Approval | TESTED | `feature/LL-BE-03-api-routing` | `f0a2e4a`; API health/404 envelope tests (6 backend tests passed). |
| LL-BE-04 | Implement item management and search APIs | Jan Africa | To Do | TESTED | `feature/LL-BE-04-item-management` | `81089e6`; item validation/auth/ID tests; backend suite (12 passed). Mongo-backed listing CRUD still requires configured MongoDB. |
| LL-BE-05 | Implement borrowing request APIs | Erice Matthew Isaiah Cama | For Approval | TESTED | `feature/LL-BE-05-borrowing-requests` | `de3105c`; backend suite (16 passed). Transaction-backed decisions/returns need MongoDB replica set for full-flow testing. |
| LL-BE-06 | Enforce borrowing limits | Erice Matthew Isaiah Cama | For Approval | TESTED | `feature/LL-BE-06-borrowing-limits` | `6213eba`; limit boundary tests; backend suite (18 passed). Replica-set concurrent approval/return path awaits DB integration. Limit five is provisional from Figma. |
| LL-BE-07 | Implement chat and messaging APIs | Erice Matthew Isaiah Cama | Doing | TESTED | `feature/LL-BE-07-chat-messaging` | `a4da5b1`; participant/auth and message-validation tests; backend suite (21 passed). Mongo transaction path awaits replica-set testing. |
| LL-BE-08 | Implement notification APIs | Jan Africa | To Do | TESTED | `feature/LL-BE-08-notifications` | `e453d78`; recipient endpoint auth/read/filter tests; backend suite (24 passed). Database-backed recipient isolation awaits MongoDB. |
| LL-BE-09 | Implement student credit score system | Erice Matthew Isaiah Cama | Doing | TESTED | `feature/LL-BE-09-credit-score` | `d4234bc`; score bounds/rule tests; backend suite (26 passed). Return-event persistence needs MongoDB integration. Rules are provisional pending group approval. |
| LL-BE-10 | Implement rewards system | Jan Africa | To Do | TESTED | `feature/LL-BE-10-rewards` | `43bea6c`; on-time-only award and protected balance tests; backend suite (28 passed). Award ledger persistence awaits replica-set testing; points rule is provisional pending group approval. |
| LL-BE-11 | Implement reporting and OSA referral APIs | Erice Matthew Isaiah Cama | To Do | TESTED | `feature/LL-BE-11-reporting-osa` | `8bd85ca`; report validation, reporter auth, and admin-role tests; backend suite (32 passed). Mongo-backed review flow awaits DB integration; no live OSA integration. |
| LL-FE-01 | Build registration and login screens | John Clarence H. Aguilar | Doing | TESTED | `feature/LL-FE-01-registration-login` | `b21aaf0`; credentialed API client, session restoration/logout, responsive ADNU registration/login UI; `pnpm build` and frontend TypeScript check passed. Full auth flow awaits a configured MongoDB instance. |
| LL-FE-02 | Build student profile and account management screens | Justin Mangubat | Doing | TESTED | `feature/LL-FE-02-student-profile` | `2a8502f`; editable name/bio/HTTPS avatar, read-only account identifiers, reputation display, profile API and validation; backend 35 tests, frontend type check/build passed. Mongo-backed profile persistence awaits database configuration. |
| LL-FE-03 | Build item listing and search interface | John Clarence H. Aguilar | Doing | TESTED | `feature/LL-FE-03-item-listing-search` | `b684ca0`; API-backed home/discover cards, search, category/availability/sort filters, pagination, loading/empty/error states; backend 36 tests and frontend type check/build passed. |
| LL-FE-04 | Build item details and listing creation screens | John Clarence H. Aguilar | Doing | TESTED | `feature/LL-FE-04-item-details-listing` | `ce7bc99`; live item details, HTTPS image URL/placeholder, create/edit/archive and availability management; backend 38 tests, frontend type check/build passed. Full persistence tests need MongoDB. |
| LL-FE-05 | Build borrowing request and loan management screens | Justin Mangubat | To Do | TESTED | `feature/LL-FE-05-borrowing-management` | `8b5791e`; request submission, owner decisions, borrower/owner loan states, return confirmation, limit feedback; backend 39 tests and frontend type check/build passed. Mongo transaction workflows need a replica-set integration run. |
| LL-FE-06 | Build student chat interface | Justin Mangubat | To Do | TESTED | `feature/LL-FE-06-chat-interface` | `a5ee6e6`; participant conversation list, paginated history, sender/timestamp bubbles, read state, message sending, loading/empty/error UI; backend 40 tests and frontend type check/build passed. Mongo transaction-backed messaging needs replica-set integration testing. |
| LL-FE-07 | Build notification interface | John Clarence H. Aguilar | To Do | TESTED | `feature/LL-FE-07-notifications` | `ecb50e2`; API-backed all/unread filters, timestamps, unread indicator, mark-read action, pagination, loading/empty/error states; backend 40 tests and frontend type check/build passed. |
| LL-FE-08 | Build student credit score and rewards UI | Justin Mangubat | To Do | TESTED | `feature/LL-FE-08-credit-rewards` | `3639c49`; score/standing, provisional policy notice, backend reward balance, score/reward event histories, empty/loading/error states; backend 42 tests and frontend type check/build passed. Full event persistence awaits MongoDB transaction testing. |
| LL-FE-09 | Build item reporting interface | John Clarence H. Aguilar | To Do | NOT STARTED | `feature/LL-FE-09-item-reporting` | — |
| LL-INT-02 | Integrate registration and login | Ian Karl S. Esmabe, Jan Africa, John Clarence H. Aguilar | Doing | NOT STARTED | `feature/LL-INT-02-auth-integration` | — |
| LL-INT-03 | Integrate item search and borrowing workflows | Ian Karl S. Esmabe, Jan Africa, John Clarence H. Aguilar, Justin Mangubat | To Do | NOT STARTED | `feature/LL-INT-03-item-borrowing-integration` | — |
| LL-INT-04 | Integrate chat and messaging functionality | Trello text: Ian Karl S. Esmabe, Justin Mangubat, Erice Matthew Isaiah Cama | To Do | NOT STARTED | `feature/LL-INT-04-chat-integration` | Export member IDs also assign John Clarence H. Aguilar; discrepancy retained per task prompt. |
| LL-INT-05 | Integrate notifications, credit scores, and rewards | Ian Karl S. Esmabe, John Clarence H. Aguilar, Justin Mangubat, Jan Africa, Erice Matthew Isaiah Cama | To Do | NOT STARTED | `feature/LL-INT-05-notifications-credit-rewards` | — |
| LL-INT-06 | Integrate reporting and OSA referral functionality | Ian Karl S. Esmabe, John Clarence H. Aguilar, Erice Matthew Isaiah Cama | To Do | NOT STARTED | `feature/LL-INT-06-reporting-osa-integration` | — |
| LL-INT-07 | Perform system-wide testing and bug fixing | Ian Karl S. Esmabe, Jan Africa, Erice Matthew Isaiah Cama, John Clarence H. Aguilar, Justin Mangubat | To Do | NOT STARTED | `feature/LL-INT-07-system-testing` | — |

## Technical decisions and blockers

- Ticket branches remain local and unmerged. Branches with dependencies are
  based on their prerequisite ticket branch; no feature branch is merged into
  `main` or another permanent ticket branch.
- The project uses a pnpm workspace; the frontend is React/Vite and the API is
  Express/Mongoose.
- GitHub write access is the current external blocker. Do not copy credentials
  into chat or source files.
- Score/reward values are provisional until group approval. The API keeps those
  rules centralized so approved values can be changed without client trust.
- Test coverage and test results will be recorded on each ticket as it is
  completed; code written alone is not marked TESTED.
