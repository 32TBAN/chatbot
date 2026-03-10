# Frontend Auth Integration

## Understanding Summary

- Integrate `FRONTEND/src-web` with the real NestJS backend in `BACKEND/src`.
- Use the backend API prefix `/api`, with auth endpoints at `/api/auth/login` and `/api/auth/me`.
- Limit the first phase to login and session restoration only.
- Remove the mock auth flow based on frontend-only users in `localStorage`.
- Hide registration and password recovery from the active UI for now.
- Persist the JWT in `localStorage` as an MVP decision.
- Configure the backend base URL through Vite using `VITE_API_URL`.

## Assumptions

- `POST /auth/login` returns `accessToken` plus a `user` object.
- `GET /auth/me` accepts `Authorization: Bearer <token>`.
- If `/auth/me` fails, the frontend should clear the local session and return to login.
- No other dashboard sections need live backend data in this phase.

## Decision Log

- Decision: integrate `FRONTEND/src-web`.
  Alternatives: `FRONTEND/src`, both frontends.
  Why: the new panel is the correct target for ongoing work.
- Decision: scope the first phase to authentication only.
  Alternatives: connect more dashboard modules immediately.
  Why: this keeps the change small, testable, and low-risk.
- Decision: use JWT persistence in `localStorage`.
  Alternatives: cookies or no session persistence.
  Why: acceptable MVP trade-off with the current backend.
- Decision: use `VITE_API_URL` for the backend base URL.
  Alternatives: hardcoded URL or same-origin relative paths.
  Why: avoids hardcoding and keeps development/deployment flexible.
- Decision: hide registration and recovery.
  Alternatives: keep visible with placeholders, implement now.
  Why: the visible backend auth contract currently supports login and `me`.

## Final Design

The frontend will keep the existing auth context and login screen structure, but the auth source of truth changes from mock browser state to the real backend API. A small API helper will read `VITE_API_URL`, normalize request paths, and provide clear failures for missing configuration and HTTP/network errors.

`src-web/lib/auth.ts` will manage the token lifecycle. On login, it will call `POST /auth/login`, validate that an `accessToken` is present, persist the token locally, and return the backend user. On app bootstrap, `getSessionUser()` will read the token and call `GET /auth/me`. If that call fails due to authorization or malformed data, the stored token is removed and the user is treated as signed out. Logout remains frontend-only and clears local session state.

The auth UI will be reduced to login-only for this phase. Registration and recovery will no longer be part of the active navigation, which avoids exposing unfinished backend capabilities. Validation remains local in the form, while backend failures are mapped into user-facing messages for invalid credentials, connection problems, and unexpected server responses.

## Risks

- Storing JWT in `localStorage` is acceptable for MVP but not ideal for hardened production security.
- If the backend response shape changes, the frontend auth parser will need to be updated.
- Other dashboard sections still use mock data and remain intentionally out of scope.
