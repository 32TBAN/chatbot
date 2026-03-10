# Backend Refactor Design

## Understanding Summary

- The current backend will be replaced completely by a new backend built with NestJS, TypeScript, Prisma, and PostgreSQL.
- The target functional contract is the schema defined in `database/db.sql`.
- The first version must include all modules from the schema: businesses, users, business settings, WhatsApp sessions, customers, products, appointments, messages, flows, flow nodes, flow options, customer notes, and payments.
- The API will be REST JSON only.
- Authentication must use JWT from the first version.
- Tenant isolation must be enforced by `business_id`.
- This first delivery is a technical MVP: complete architecture and functional endpoints, without full production hardening.

## Assumptions

- Prisma will be the operational data layer, while remaining functionally aligned with `database/db.sql`.
- PostgreSQL will be configured through `DATABASE_URL` in environment variables, using the provided Railway connection string.
- Authentication applies to panel users stored in `users`.
- JWT payload will include at least `userId`, `businessId`, and `role`.
- No refresh-token flow is required in the MVP.
- WhatsApp integration is limited to persistence and API structure in this phase; no external provider integration is required yet.
- Existing Express routes will not be preserved for backward compatibility.
- Initial load is low, so maintainability is prioritized over advanced optimization.

## Decision Log

1. Replace the backend completely instead of migrating gradually.
   - Alternatives considered: partial compatibility, phased migration.
   - Reason: the current Express domain does not match the target SQL schema, so forced compatibility would add unnecessary debt.

2. Include the full schema scope in the first version.
   - Alternatives considered: start with only core entities.
   - Reason: the requested target is the full WhatsApp automation backend defined in `database/db.sql`.

3. Use a modular NestJS monolith.
   - Alternatives considered: repository-heavy layering, event-oriented architecture from day one.
   - Reason: lowest complexity for a low-traffic MVP while keeping strong maintainability.

4. Use JWT authentication from the first version.
   - Alternatives considered: no authentication initially.
   - Reason: tenant isolation and role-based access need to be correct from the start.

5. Resolve tenant context from the authenticated user instead of client-supplied `business_id`.
   - Alternatives considered: passing `business_id` in requests.
   - Reason: prevents cross-tenant access and simplifies API trust boundaries.

6. Use Prisma as the main access layer instead of raw SQL with `pg`.
   - Alternatives considered: keeping manual SQL queries.
   - Reason: Prisma matches the requested stack and improves schema consistency and development velocity.

## Final Design

### Architecture

The new backend will be a standard NestJS TypeScript project that replaces the current Express entrypoint and route/controller structure. The application will be organized as a modular monolith with:

- `AppModule`
- `PrismaModule`
- `AuthModule`
- `BusinessesModule`
- `UsersModule`
- `BusinessSettingsModule`
- `WhatsappSessionsModule`
- `CustomersModule`
- `ProductsModule`
- `AppointmentsModule`
- `MessagesModule`
- `FlowsModule`
- `FlowNodesModule`
- `FlowOptionsModule`
- `CustomerNotesModule`
- `PaymentsModule`

Each domain module will follow the NestJS pattern of `controller`, `service`, and `dto`. Business logic will remain in services; controllers will only handle request/response orchestration.

### Data Layer

`database/db.sql` is the functional source for the target model. It will be translated to `schema.prisma` with:

- enums for all SQL enums
- UUID primary keys
- explicit relations between entities
- unique constraints matching the SQL contract
- indices matching the SQL intent where useful in Prisma

Prisma will be the runtime ORM and migration tool for future changes. The PostgreSQL connection will be provided through `.env` using `DATABASE_URL`.

### Authentication and Authorization

Authentication will use `email` and password against `users`. Passwords will be stored as secure hashes in `password_hash`. The first version will support:

- `POST /auth/login`
- `GET /auth/me`

JWT payload will include:

- `userId`
- `businessId`
- `role`

Authorization will be role-based using `owner`, `admin`, and `agent`. The MVP will enforce coarse rules such as:

- `owner` and `admin` can manage users and business settings
- `agent` can access operational entities within the same business with narrower permissions

### Tenant Isolation

Tenant isolation is mandatory and will be enforced in the service layer. The API should not trust a client-provided `business_id` for protected routes. Instead:

- the authenticated JWT defines the current tenant
- services filter entities by the authenticated `businessId`
- nested entities are validated through their parent relation to confirm same-business ownership

Examples:

- `customers`, `products`, `appointments`, `payments`, `messages`, and `whatsapp_sessions` filter directly by `business_id`
- `flow_nodes` and `flow_options` validate ownership through `flow`
- `customer_notes` validate ownership through `customer` and `user`

### API Shape

The API will be REST JSON only. Initial endpoint families will include:

- `/auth`
- `/businesses`
- `/users`
- `/business-settings`
- `/whatsapp-sessions`
- `/customers`
- `/products`
- `/appointments`
- `/messages`
- `/flows`
- `/flow-nodes`
- `/flow-options`
- `/customer-notes`
- `/payments`

For the MVP, each resource should expose predictable CRUD-style operations where they make sense:

- list
- get by id
- create
- update
- delete

`businesses` may require a special creation flow for initial onboarding, but post-creation access remains protected.

### Validation and Errors

DTO validation will use NestJS validation pipes and `class-validator`. Error behavior should be consistent:

- `400` for invalid payloads
- `401` for missing or invalid authentication
- `403` for forbidden access or cross-role restrictions
- `404` for resources not found inside the authenticated tenant
- `409` for unique constraint conflicts

No complex exception layer is required in the MVP beyond consistent NestJS exception handling.

### Implementation Order

Recommended implementation sequence:

1. Create the new NestJS + TypeScript project structure.
2. Install and configure Prisma.
3. Translate `database/db.sql` into `schema.prisma`.
4. Configure PostgreSQL connection via `.env`.
5. Create `PrismaModule` and shared config.
6. Implement `AuthModule` with JWT.
7. Implement core tenant-aware modules:
   - businesses
   - users
   - business settings
   - customers
   - products
   - appointments
   - payments
8. Implement remaining modules:
   - whatsapp sessions
   - messages
   - flows
   - flow nodes
   - flow options
   - customer notes
9. Verify application boot, database connectivity, auth flow, and a small set of critical CRUD operations.

### Testing Strategy

The MVP should at least verify:

- application boots correctly
- Prisma connects to PostgreSQL
- JWT login works
- tenant filtering works on protected endpoints
- one or two representative CRUD flows succeed end-to-end

Recommended early smoke tests:

- login + `me`
- create/list customers
- create/list appointments
- create/list payments
- create/list flows with flow nodes/options
