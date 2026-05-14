# НеоЛифт Prisma migrations

This directory is initialized for `prisma migrate deploy`. The existing schema is the source of truth for the pilot database; generate the initial SQL migration in an environment with Prisma CLI registry access using:

```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/20260514000000_initial/migration.sql
npx prisma migrate deploy
```

The execution environment used for this stabilization pass blocked npm registry access for Prisma packages, so the migration SQL could not be generated here.
