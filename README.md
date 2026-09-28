# KACY POKER

Static site deployed from `main` to Vercel. `index.html` contains the site and admin UI. Public navigation coordinates remain in `venue-locations.js`; only verified venue locations should be added there.

## Schedule management

Schedules are loaded from Supabase, not hardcoded in HTML. Use `/admin` → 일정 관리 to create, edit, or delete them. Registering an unfamiliar venue also saves its name for later reuse. Deleting a schedule is a soft delete and preserves its venue.

- `schedule_events`: dated visits and multi-day notices, optional time, version for edit conflicts.
- `schedule_venues`: reusable names, seeded from all prior schedules.
- Public clients can read active events and venue names. Writes use password-checked RPCs.
- `admin_check_password` reuses the existing server-side admin password validation; the browser retains the entered password only in memory until logout/reload.
- `admin_save_schedule` creates or version-checks updates; `admin_delete_schedule` version-checks soft deletes.
- Existing RSVP records remain associated with year/month/day, as before.

`migrations/20260928_schedule_admin.sql` was applied to the production project on 2026-09-28. It creates the schema and migrates the 69 existing events and 23 venue names. It is a one-time migration: do not rerun it against an initialized database.

Run regression checks with:

```sh
node --test tests/schedule.test.cjs
```

The migration, tests, and documentation are excluded from Vercel's static deployment by `.vercelignore`.
