# Auth Register Restoration

## Understanding Summary

- Restore the frontend auth flow to include both login and public user registration.
- The register form must request `name`, `phone?`, `email`, `password`, and `confirmPassword`.
- `phone` remains optional.
- Registration creates a user account only; business data will be completed later.
- The backend should expose a public endpoint for registration without requiring an existing `businessId`.
- `confirmPassword` is frontend-only validation and should not be sent to the backend.
- The existing session restoration flow with JWT remains in place.

## Assumptions

- The backend will expose `POST /api/auth/register`.
- The request body will be `{ name, phone?, email, password }`.
- The backend may return either a login-shaped response or a plain success response.
- Users without `businessId` are allowed to exist and log in.
- MVP requirements are modest: standard web performance, basic validation, and clear error handling.

## Decision Log

- Decision: restore a dual-mode auth shell with `login` and `register`.
  Alternatives: separate routes, modal register flow.
  Why: the current structure already supports this with minimal change.
- Decision: keep `phone` optional and `confirmPassword` frontend-only.
  Alternatives: require phone, send confirmPassword to backend.
  Why: this matches the previous behavior and keeps the backend contract focused.
- Decision: target a new public backend endpoint for registration.
  Alternatives: reuse protected `/users`, use business onboarding.
  Why: neither existing endpoint supports public self-registration.
- Decision: on successful registration, prefer moving the user to login with a success message unless the backend returns a full auth payload.
  Alternatives: require automatic login.
  Why: this is more tolerant of backend response changes.

## Final Design

The frontend auth context will support two modes, `login` and `register`, with independent form state and validation. The login flow continues to use JWT persistence and session restoration through `/auth/login` and `/auth/me`.

The register flow will submit `{ name, phone?, email, password }` to a new public backend endpoint. The frontend will validate `name`, `email`, `password`, and `confirmPassword` locally before sending the request. If registration succeeds without an auth token, the UI will switch back to login, preserve the email, clear the passwords, and show a success message. If the backend returns `{ accessToken, user }`, the frontend can accept it and start the session immediately.

Backend and frontend should both tolerate users without `businessId`, since business setup is intentionally deferred. Common failures such as duplicate email, validation errors, network problems, and unexpected server responses should be mapped into user-facing auth messages.

## Risks

- The backend contract for registration is not yet visible in this repository, so the frontend must be somewhat defensive.
- Automatic login after registration only works if the backend returns the same shape as login.
- If users without `businessId` are not fully supported in JWT/session code, login could fail after successful registration.
