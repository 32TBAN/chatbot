# WhatsApp Debug View Design

## Understanding Summary
- Add a new `Debug` section in the dashboard sidebar below `Configuracion`.
- Only `owner` users can use this section.
- The goal is to test inbound WhatsApp automation from the browser as if the business session were active.
- The MVP supports text messages only.
- The contract and UI should be ready to grow toward image, video, and PDF later.
- Debug interactions must be visible in the system history as clearly marked test conversations.
- Reflecting the debug inbound in the real phone WhatsApp is optional and not required for the MVP.

## Assumptions
- The current WhatsApp runtime already contains the source-of-truth automation logic for inbound replies.
- A backend debug endpoint is required because the runtime currently reacts only to `whatsapp-web.js` events.
- Using `Customer.source = "debug"` is enough to distinguish test conversations without a schema migration.
- Debug should require a connected WhatsApp session and an active runtime handle.

## Decision Log
- Decided to add a dedicated dashboard section instead of placing debug inside settings.
  - Alternative considered: add a block under `Configuracion`.
  - Reason: the user requested an explicit section in the menu.
- Decided to simulate inbound messages through a backend endpoint.
  - Alternatives considered: frontend-only mock, or trying to forge real inbound events in WhatsApp.
  - Reason: backend simulation can reuse the real automation logic with lower fragility.
- Decided to mark debug conversations through existing customer metadata.
  - Alternative considered: schema changes for a dedicated debug flag.
  - Reason: lower risk and faster MVP without data model migration.
- Decided to restrict the feature to `owner` and verify it in backend and frontend.
  - Alternative considered: rely only on frontend visibility.
  - Reason: backend enforcement is required for security.

## Final Design
- Extract inbound automation handling from the WhatsApp runtime into a shared backend service.
- Reuse that service from both the real runtime and a new debug endpoint.
- Add `POST /whatsapp-sessions/debug/inbound` that:
  - validates `owner` role
  - validates business setup
  - validates connected session and active runtime
  - creates or reuses a debug customer
  - stores the simulated inbound message
  - resolves and stores outbound bot replies
  - returns the resulting conversation payload
- Add a `Debug` dashboard view in frontend that:
  - checks the real WhatsApp session state
  - blocks execution if the session is not connected
  - lets the user write a text message and run the simulation
  - renders the resulting conversation in chat format
- Extend history payloads to expose whether a conversation comes from debug so the UI can label it as `Prueba`.
