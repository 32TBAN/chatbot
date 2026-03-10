# Auth Register DB Fix

`POST /auth/register` creates users before they create a business. For that flow to work, `users.business_id` must allow `NULL`.

Apply this SQL to any existing database that still has `users.business_id` as `NOT NULL`:

```sql
ALTER TABLE users
ALTER COLUMN business_id DROP NOT NULL;
```

If Prisma is the source of truth for the environment, also align the schema with:

```powershell
npm run prisma:push
```
