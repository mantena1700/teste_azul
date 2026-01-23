# Database Documentation

## Overview
This directory contains the database schema definitions and related SQL scripts for the PostgreSQL database.

## Key Files
- **`schema.sql`**: The master source of truth for the database structure. It defines all tables, relationships (foreign keys), and initial seed data.

## Schema Management
- **Tables**: Clinics, Users, Patients, Sessions, Appointments, Financial Transactions, Logs, etc.
- **Relationships**: Most tables link back to `clinics(id)` for multi-tenancy.
- **JSON Fields**: Some flexible data (like `schedule` or `financial` config) is stored in `JSONB` columns.

## Making Changes
1.  **Edit `schema.sql`**: Always update this file first so it reflects the desired state.
2.  **Apply Changes**:
    - For a new deployment: The `deploy.sh` script (via `backend/apply_schema.js` or manual setup) initiates the DB using this schema.
    - For existing systems: Create a migration script (like `backend/apply_schema.js`) to apply ONLY the new changes (e.g., `ALTER TABLE`, `CREATE TABLE` for new features). DO NOT just run `schema.sql` again on a production DB as it might try to recreate existing tables.

## Best Practices
- **Multi-tenancy**: Always ensure new tables have a `clinic_id` column to segregate data.
- **Indexes**: Add indexes for frequently queried columns (like `clinic_id`, `date`, `user_id`).
